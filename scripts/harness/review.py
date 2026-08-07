"""Fresh-context blocking review stage."""

from __future__ import annotations

import json
import re
import sys

from harness.agents import spawn_agent
from harness.context import (
    ERROR_SUMMARY_MAX,
    PHASES_DIR,
    REPO_ROOT,
    append_exhausted_item,
    get_config,
    log_event,
)
from harness.runner import run_gates, run_smoke, run_verification, scope_check
from harness.state import save_phase

REVIEW_MARKER_RE = re.compile(r"^MUST_FIX:\s*(none|\d+)\s*$", re.MULTILINE)

REVIEW_BRIEF_TEMPLATE = """You are a fresh-context reviewer auditing a just-implemented phase of
the {project_name} project. Do NOT modify code — surface defects only.
You are running inside the repo; use git and file reads to inspect.

## Phase under review

- Phase id: {phase_id}
- Phase spec: phases/{phase_id}.md (read it first)
- Acceptance criteria:
{acceptance}

The phase's changes are the UNCOMMITTED working tree: run
`git status --porcelain` and `git diff` (plus read new untracked files)
to see exactly what was written.

## Project conventions (load before reviewing)

- {agents_file} — read every numbered section
- Project docs listed in section 1 of {agents_file}
- Any CRITICAL / MUST NOT tokens in those docs are non-negotiable;
  flag violations as MUST_FIX.

## Output contract (machine-parsed — follow exactly)

Your final reply must be ONLY a JSON object, no prose, no code fences:

    {{
      "must_fix": ["file:line — defect — suggested fix", ...],
      "should_fix": ["file:line — issue — suggested fix", ...],
      "backlog_worthy": ["one-line item with priority guess", ...]
    }}

An empty `must_fix` array means the phase is clean to ship. must_fix =
defects that block correctness, violate a documented invariant, or are
security risks. Judgment calls and preferences are NOT must_fix. Keep
each finding to one string. Stay under 400 words total.
{scope_section}{security_addendum}"""

SCOPE_SECTION_TEMPLATE = """
## Scope check (mechanical pre-computation)

These changed files match none of the phase's declared `files` globs:

{out_of_scope}

Judge each one: unjustified out-of-scope work is scope creep and a
must_fix finding; incidental necessary changes (lockfiles, generated
files, unavoidable wiring) may pass — note them in should_fix or
backlog_worthy instead.
"""

SECURITY_ADDENDUM = """
## Security focus

This phase is flagged security-sensitive. Additionally threat-model the
change: authn/authz surfaces, secret handling, injection, unsafe
deserialization, PII leaks to logs/stdout. Report findings in the same
buckets."""


def build_review_brief(phase: dict) -> str:
    config = get_config()
    acceptance = "\n".join(f"  - {a}" for a in phase.get("acceptance", [])) or "  (none listed)"
    out_of_scope = phase.get("out_of_scope_files") or []
    scope_section = (
        SCOPE_SECTION_TEMPLATE.format(out_of_scope="\n".join(f"- {p}" for p in out_of_scope))
        if out_of_scope
        else ""
    )
    return REVIEW_BRIEF_TEMPLATE.format(
        project_name=config["project_name"],
        phase_id=phase["id"],
        acceptance=acceptance,
        agents_file=config["agents_file"],
        scope_section=scope_section,
        security_addendum=SECURITY_ADDENDUM if phase.get("security_review") else "",
    )


def _extract_review_json(output: str) -> dict | None:
    """Pull the review JSON object out of the reply, tolerating fences
    and surrounding prose. None when no object with a `must_fix` list
    is found."""
    text = output.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n|\n```\s*$", "", text)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        data = json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict) or not isinstance(data.get("must_fix"), list):
        return None
    return data


def _bullets(items: list) -> str:
    return "\n".join(f"- {item}" for item in items if isinstance(item, str) and item.strip())


def parse_review(output: str) -> tuple[int | None, str, str]:
    """Return (must_fix_count, must_fix_text, all_findings_text).

    count None = unparseable. Primary contract is the JSON object; the
    legacy `MUST_FIX:` marker is kept as a fallback so hand-run or
    off-contract reviewers still parse.
    """
    data = _extract_review_json(output)
    if data is not None:
        raw_must_fix = data["must_fix"]
        # Fail CLOSED on off-contract items: a must_fix entry that is not
        # a non-empty string (e.g. an object) must never silently count
        # as zero findings — that shipped-a-bad-phase failure mode is
        # exactly what this contract exists to prevent.
        if any(not isinstance(x, str) or not x.strip() for x in raw_must_fix):
            return None, "", output
        must_fix = [x.strip() for x in raw_must_fix]
        sections = [("MUST_FIX", must_fix)]
        for key in ("should_fix", "backlog_worthy"):
            items = data.get(key)
            if isinstance(items, list) and items:
                sections.append((key.upper(), items))
        all_text = "\n\n".join(f"{name}:\n{_bullets(items)}" for name, items in sections if items)
        return len(must_fix), _bullets(must_fix), all_text

    m = REVIEW_MARKER_RE.search(output)
    if not m:
        return None, "", output
    val = m.group(1)
    if val == "none":
        return 0, "", ""
    count = int(val)
    section = ""
    idx = output.find("### MUST_FIX")
    if idx != -1:
        rest = output[idx + len("### MUST_FIX") :]
        next_heading = rest.find("### ")
        section = rest[:next_heading] if next_heading != -1 else rest
    must_fix_text = section.strip() or output[m.end() :].strip()
    return count, must_fix_text, must_fix_text


def review_stage(phase: dict, phase_id: str) -> int:
    """Blocking review loop: review -> fix -> re-verify -> re-review, up
    to max_review_cycles fix rounds. Persistent MUST_FIX => needs_human.
    """
    config = get_config()
    max_cycles = int(phase.get("max_review_cycles", config["max_review_cycles"]))
    verification_cmd = phase.get("verification_cmd", config["default_verification_cmd"])
    fix_cycles = 0

    while True:
        print(f"  → review (cycle {fix_cycles + 1})")
        # Recomputed every cycle — the fixer may have touched new files.
        scope_check(phase, phase_id)
        failed, output = spawn_agent(build_review_brief(phase), role="reviewer", phase=phase)
        if failed:
            print("review agent failed to run:", file=sys.stderr)
            print(output[-ERROR_SUMMARY_MAX:], file=sys.stderr)
            return 1

        count, must_fix_text, all_findings = parse_review(output)
        log_event(
            {
                "event": "review_completed",
                "phase_id": phase_id,
                "cycle": fix_cycles + 1,
                "must_fix_count": count if count is not None else "unparseable",
            }
        )

        if count is None:
            phase["status"] = "needs_human"
            phase["review_findings"] = output[-2000:]
            save_phase(phase)
            print(
                "REVIEW UNPARSEABLE: reviewer emitted neither the JSON "
                "contract nor the legacy `MUST_FIX:` marker. Raw output "
                "saved to the phase JSON; triage manually.",
                file=sys.stderr,
            )
            return 2

        # Capped: this lands in the repo-committed phase JSON.
        phase["review_findings"] = all_findings[:4000]
        save_phase(phase)

        if count == 0:
            print("  → review clean")
            return 0

        fix_cycles += 1
        phase["review_cycles"] = fix_cycles
        save_phase(phase)
        if fix_cycles > max_cycles:
            phase["status"] = "needs_human"
            save_phase(phase)
            append_exhausted_item(
                REPO_ROOT / config["backlog_path"],
                phase_id=phase_id,
                max_attempts=max_cycles,
                verification_cmd="review MUST_FIX cycle",
                last_error_summary=must_fix_text[:200],
                label="review cycles exhausted",
            )
            print(
                f"REVIEW EXHAUSTED: MUST_FIX findings persist after {max_cycles} "
                f"fix cycles. Phase marked needs_human.",
                file=sys.stderr,
            )
            return 2

        print(f"  → {count} MUST_FIX finding(s); dispatching fix (cycle {fix_cycles})")
        spec_prompt = (PHASES_DIR / f"{phase_id}.md").read_text()
        fix_task = (
            f"{spec_prompt}\n\n"
            f"The phase implementation is complete and verified, but a "
            f"fresh-context review found blocking MUST_FIX findings:\n\n"
            f"{must_fix_text}\n\n"
            f"Fix ONLY these findings. Do not start over or expand scope."
        )
        fix_failed, fix_output = spawn_agent(fix_task, role="fixer", phase=phase)
        if fix_failed:
            phase["status"] = "needs_human"
            save_phase(phase)
            print("fix agent failed to run:", file=sys.stderr)
            print(fix_output[-ERROR_SUMMARY_MAX:], file=sys.stderr)
            return 2

        returncode, tail = run_verification(verification_cmd)
        if returncode != 0:
            phase["status"] = "needs_human"
            save_phase(phase)
            print("verification failed after review fix; marked needs_human:", file=sys.stderr)
            print(tail, file=sys.stderr)
            return 2
        if run_gates(phase) != 0:
            phase["status"] = "needs_human"
            save_phase(phase)
            return 2
        rc = run_smoke(phase, phase_id, require_retro_followup=False)
        if rc != 0:
            phase["status"] = "needs_human"
            save_phase(phase)
            return rc
