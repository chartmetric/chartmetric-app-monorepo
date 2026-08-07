"""Retro schema validation, mechanical assembly, and agent drafting."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone

from harness.agents import spawn_agent
from harness.context import (
    PHASES_DIR,
    REPO_ROOT,
    SMOKE_SKIP_FOLLOWUP_PREFIX,
    get_config,
    now_iso,
)

# Retro file schema — applies to phases/<id>.retro.json.
RETRO_REQUIRED_KEYS = (
    "phase_id",
    "duration_min",
    "gates_fired",
    "git_diff_summary",
    "tests_added",
    "tests_passing_total",
)
RETRO_GATE_REQUIRED_KEYS = ("hook", "deny_count", "allow_count", "examples")
RETRO_MAX_LINES = 80
RETRO_SMOKE_RESULTS = ("pass", "fail", "skipped")


def validate_retro(phase_id: str) -> list[str]:
    """Return a list of validation errors for phases/<phase_id>.retro.json."""
    retro_path = PHASES_DIR / f"{phase_id}.retro.json"
    if not retro_path.exists():
        return [f"retro file not found: {retro_path.relative_to(REPO_ROOT)}"]
    return validate_retro_text(phase_id, retro_path.read_text())


def validate_retro_text(phase_id: str, raw: str) -> list[str]:
    errors: list[str] = []
    line_count = len(raw.splitlines())
    if line_count > RETRO_MAX_LINES:
        errors.append(
            f"retro is {line_count} lines; keep under {RETRO_MAX_LINES} (enforce conciseness)"
        )

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        errors.append(f"retro is not valid JSON: {e}")
        return errors

    if not isinstance(data, dict):
        errors.append("retro top-level must be an object")
        return errors

    for key in RETRO_REQUIRED_KEYS:
        if key not in data:
            errors.append(f"required key missing: {key}")

    if "phase_id" in data and data["phase_id"] != phase_id:
        errors.append(f"phase_id mismatch: retro says {data['phase_id']!r}, finishing {phase_id!r}")

    if "gates_fired" in data:
        gates = data["gates_fired"]
        if not isinstance(gates, list):
            errors.append("gates_fired must be a list")
        else:
            for i, item in enumerate(gates):
                if not isinstance(item, dict):
                    errors.append(f"gates_fired[{i}] must be an object")
                    continue
                for k in RETRO_GATE_REQUIRED_KEYS:
                    if k not in item:
                        errors.append(f"gates_fired[{i}] missing key: {k}")
                examples = item.get("examples")
                if isinstance(examples, list):
                    for j, ex in enumerate(examples):
                        if not isinstance(ex, str) or not ex.strip():
                            errors.append(
                                f"gates_fired[{i}].examples[{j}] must be a non-empty string"
                            )

    if "smoke_run" in data:
        smoke = data["smoke_run"]
        if not isinstance(smoke, dict):
            errors.append("smoke_run must be an object")
        else:
            result = smoke.get("result")
            if result not in RETRO_SMOKE_RESULTS:
                errors.append(f"smoke_run.result must be one of {RETRO_SMOKE_RESULTS}")
            ts = smoke.get("ts", "")
            try:
                datetime.fromisoformat(str(ts))
            except ValueError:
                errors.append(
                    f"smoke_run.ts is not a parseable ISO timestamp: {ts!r} "
                    f"(placeholders like 'filled-at-finish-time' are refused)"
                )

    return errors


def retro_followups(phase_id: str) -> list:
    retro_path = PHASES_DIR / f"{phase_id}.retro.json"
    try:
        data = json.loads(retro_path.read_text())
    except (OSError, json.JSONDecodeError):
        return []
    followups = data.get("followups", [])
    return followups if isinstance(followups, list) else []


def has_skip_followup(followups: list) -> bool:
    for item in followups:
        if isinstance(item, str) and item.lstrip().lower().startswith(SMOKE_SKIP_FOLLOWUP_PREFIX):
            return True
    return False


def audit_events_since(ts: str) -> list[dict]:
    audit_path = REPO_ROOT / ".harness" / "audit.jsonl"
    if not audit_path.exists():
        return []
    events = []
    for line in audit_path.read_text().splitlines():
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue
        if str(ev.get("ts", "")) >= ts:
            events.append(ev)
    return events


def mechanical_retro(phase: dict, phase_id: str) -> dict:
    """Assemble the mechanically-derivable retro fields."""
    started = phase.get("run_started_at", now_iso())
    try:
        start_dt = datetime.fromisoformat(started)
        duration = max(0, int((datetime.now(timezone.utc) - start_dt).total_seconds() // 60))
    except ValueError:
        duration = 0

    events = audit_events_since(started)
    deny_by_hook: dict[str, list[str]] = {}
    for ev in events:
        if ev.get("decision") == "deny" and ev.get("hook"):
            deny_by_hook.setdefault(ev["hook"], []).append(str(ev.get("reason", ""))[:160])
    gates_fired = [
        {
            "hook": hook,
            "deny_count": len(reasons),
            "allow_count": 0,
            "examples": reasons[:3],
        }
        for hook, reasons in deny_by_hook.items()
    ] or [{"hook": "dangerous_cmd_guard", "deny_count": 0, "allow_count": 0, "examples": []}]

    try:
        diff_stat = subprocess.run(
            "git diff --stat HEAD | tail -1 && git status --porcelain | wc -l",
            shell=True,
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=int(get_config()["command_timeout_sec"]),
        ).stdout.strip()
    except subprocess.TimeoutExpired:
        diff_stat = ""

    retro: dict = {
        "phase_id": phase_id,
        "duration_min": duration,
        "gates_fired": gates_fired,
        "git_diff_summary": diff_stat or "(no diff captured)",
        "tests_added": 0,
        "tests_passing_total": 0,
        "drafted_by": "agent",
        "surprises": [],
        "proposed_rules": [],
        "followups": [],
    }
    if phase.get("smoke_result"):
        smoke = dict(phase["smoke_result"])
        skip_reason = smoke.pop("skip_reason", None)
        retro["smoke_run"] = smoke
        if skip_reason:
            retro["followups"].append(f"smoke skipped: {skip_reason}")
    return retro


RETRO_DRAFT_PROMPT = """Draft the post-phase retro for phase {phase_id} of this project.

A retro is a JSON file. Start from this mechanically-derived skeleton
(these fields are ground truth — keep them, but correct tests_added /
tests_passing_total from the actual test output if you can determine
them by running the verification command or reading recent output):

{skeleton}

Review findings from the fresh-context review of this phase (use these
to ground `surprises`, and turn durable conventions into
`proposed_rules` entries of shape {{"target": "{agents_file}", "diff": "..."}}):

{findings}

Retry/audit events during the run:

{events}

Rules:
- Max 3 `surprises`, each one sentence, only genuine surprises.
- `followups` = real deferred work, prefixed P1/P2/P3. KEEP any
  existing entries in the skeleton's followups array.
- Keep `drafted_by` as "agent".
- Total file must be under {max_lines} lines.
- Output ONLY the JSON object. No prose, no code fences."""


def draft_retro(phase: dict, phase_id: str) -> int:
    config = get_config()
    retro_path = PHASES_DIR / f"{phase_id}.retro.json"
    skeleton = mechanical_retro(phase, phase_id)
    events = audit_events_since(phase.get("run_started_at", ""))
    event_lines = "\n".join(
        json.dumps(ev, ensure_ascii=False)[:200]
        for ev in events
        if ev.get("event", "").startswith("retry") or ev.get("event", "").startswith("review")
    )

    prompt = RETRO_DRAFT_PROMPT.format(
        phase_id=phase_id,
        skeleton=json.dumps(skeleton, indent=2, ensure_ascii=False),
        findings=phase.get("review_findings") or "(review clean — no findings)",
        events=event_lines or "(none)",
        agents_file=config["agents_file"],
        max_lines=RETRO_MAX_LINES,
    )

    draft_errors: list[str] = []
    for attempt in (1, 2):
        failed, output = spawn_agent(
            prompt
            if attempt == 1
            else f"{prompt}\n\nYour previous draft failed validation:\n"
            + "\n".join(draft_errors)
            + "\nOutput ONLY the corrected JSON.",
            role="retro",
            phase=phase,
        )
        if failed:
            break
        text = output.strip()
        if text.startswith("```"):
            text = re.sub(r"^```[a-zA-Z]*\n|\n```\s*$", "", text)
        # Tolerate prose around the JSON object.
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            text = text[start : end + 1]
        draft_errors = validate_retro_text(phase_id, text)
        if not draft_errors:
            parsed = json.loads(text)
            # Mechanical ground truth wins over whatever the agent echoed.
            if skeleton.get("smoke_run"):
                parsed["smoke_run"] = skeleton["smoke_run"]
            if phase.get("smoke_result", {}).get("skip_reason"):
                followups = parsed.setdefault("followups", [])
                if not has_skip_followup(followups):
                    followups.append(f"smoke skipped: {phase['smoke_result']['skip_reason']}")
            retro_path.write_text(json.dumps(parsed, indent=2, ensure_ascii=False) + "\n")
            print(f"  → retro drafted: phases/{phase_id}.retro.json (edit before pushing)")
            return 0

    # Fallback: the mechanical skeleton is always schema-valid.
    skeleton["followups"].append(
        "P2: retro auto-draft failed — surprises/proposed_rules need a human pass"
    )
    retro_path.write_text(json.dumps(skeleton, indent=2, ensure_ascii=False) + "\n")
    print(
        f"  → retro agent draft failed; wrote mechanical skeleton to "
        f"phases/{phase_id}.retro.json — fill in judgment fields manually",
        file=sys.stderr,
    )
    return 0
