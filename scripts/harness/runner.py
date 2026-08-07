"""Writer retry loop, verification, gates, and smoke execution."""

from __future__ import annotations

import os
import subprocess
import sys

from harness.agents import spawn_agent
from harness.context import (
    ERROR_SUMMARY_MAX,
    ERROR_TAIL_LINES,
    PHASES_DIR,
    REPO_ROOT,
    SMOKE_SKIP_FOLLOWUP_PREFIX,
    SMOKE_TAIL_LINES,
    append_exhausted_item,
    get_config,
    log_event,
    now_iso,
)
from harness.globs import path_match_any
from harness.retro import has_skip_followup, retro_followups
from harness.state import save_phase


def resolve_max_attempts(phase: dict) -> int:
    env_val = os.environ.get("HARNESS_MAX_ATTEMPTS")
    if env_val:
        try:
            return int(env_val)
        except ValueError:
            pass
    return int(phase.get("max_attempts", get_config()["max_attempts"]))


def build_task_prompt(base_prompt: str, error_feedback: str, attempt_num: int) -> str:
    if attempt_num <= 1:
        return base_prompt
    return (
        f"{base_prompt}\n\n"
        f"Previous attempt failed verification. Errors:\n"
        f"{error_feedback}\n"
        f"Fix only the failures. Do not start over."
    )


def _run_command(cmd: str, *, capture: bool = True) -> tuple[int, str, str]:
    """Run a shell command from the repo root with the configured
    command timeout. Returns (returncode, stdout, stderr); a timeout is
    reported as exit 124 with an explanatory stderr.
    """
    timeout = int(get_config()["command_timeout_sec"])
    try:
        proc = subprocess.run(
            cmd,
            shell=True,
            cwd=REPO_ROOT,
            capture_output=capture,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return 124, "", f"command timed out after {timeout}s (command_timeout_sec): {cmd}"
    return proc.returncode, proc.stdout or "", proc.stderr or ""


def run_verification(verification_cmd: str) -> tuple[int, str]:
    returncode, stdout, stderr = _run_command(verification_cmd)
    combined = (stdout + stderr).splitlines()
    return returncode, "\n".join(combined[-ERROR_TAIL_LINES:])


def write_loop(phase: dict, phase_id: str) -> tuple[bool, str]:
    """Writer retry loop: agent writes, verifier checks, errors feed the
    next attempt. Returns (succeeded, last_error_summary). The caller
    owns status transitions.
    """
    spec_path = PHASES_DIR / f"{phase_id}.md"
    base_prompt = spec_path.read_text()
    max_attempts = resolve_max_attempts(phase)
    verification_cmd = phase.get("verification_cmd", get_config()["default_verification_cmd"])

    error_feedback = ""
    last_error_summary = ""

    for attempt_num in range(1, max_attempts + 1):
        task = build_task_prompt(base_prompt, error_feedback, attempt_num)

        writer_failed, writer_output = spawn_agent(task, role="writer", phase=phase)
        if writer_failed:
            tail = writer_output[-ERROR_SUMMARY_MAX:]
            error_feedback = f"Writer agent failed before verification could run.\nTail:\n{tail}"
            last_error_summary = error_feedback[:ERROR_SUMMARY_MAX]
            phase["attempts"] = attempt_num
            save_phase(phase)
            log_event(
                {
                    "event": "retry_triggered",
                    "phase_id": phase_id,
                    "attempt": attempt_num,
                    "reason": "writer_failed",
                    "error_summary": last_error_summary,
                }
            )
            continue

        returncode, tail = run_verification(verification_cmd)
        phase["attempts"] = attempt_num
        save_phase(phase)

        if returncode == 0:
            log_event({"event": "retry_succeeded", "phase_id": phase_id, "attempt": attempt_num})
            return True, ""

        error_feedback = tail
        last_error_summary = error_feedback[:ERROR_SUMMARY_MAX]
        log_event(
            {
                "event": "retry_triggered",
                "phase_id": phase_id,
                "attempt": attempt_num,
                "error_summary": last_error_summary,
            }
        )

    log_event(
        {
            "event": "retry_exhausted",
            "phase_id": phase_id,
            "max_attempts": max_attempts,
            "last_error_summary": last_error_summary,
        }
    )
    return False, last_error_summary


def handle_exhaustion(phase: dict, phase_id: str, last_error_summary: str) -> None:
    phase["status"] = "exhausted"
    save_phase(phase)
    config = get_config()
    backlog_err = append_exhausted_item(
        REPO_ROOT / config["backlog_path"],
        phase_id=phase_id,
        max_attempts=resolve_max_attempts(phase),
        verification_cmd=phase.get("verification_cmd", config["default_verification_cmd"]),
        last_error_summary=last_error_summary,
    )
    if backlog_err:
        print(f"warning: backlog auto-append failed: {backlog_err}", file=sys.stderr)


def scope_check(phase: dict, phase_id: str) -> list[str]:
    """Diff the uncommitted working tree against the phase's declared
    `files` globs. Returns (and records) the out-of-scope list.

    Scope creep was the most common writer failure observed in
    production use; this makes it visible mechanically. Not a hard
    gate — lockfiles and wiring are sometimes legitimately touched —
    the list is fed to the reviewer, who judges each entry.
    """
    globs = phase.get("files") or []
    if not globs:
        phase.pop("out_of_scope_files", None)
        save_phase(phase)
        return []

    try:
        proc = subprocess.run(
            "git status --porcelain",
            shell=True,
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=int(get_config()["command_timeout_sec"]),
        )
    except subprocess.TimeoutExpired:
        print("  → scope check skipped: git status timed out", file=sys.stderr)
        return []
    changed: list[str] = []
    for line in proc.stdout.splitlines():
        path = line[3:].strip()
        if " -> " in path:
            path = path.split(" -> ")[-1]
        changed.append(path.strip('"'))

    out_of_scope = [
        p
        for p in changed
        if p
        and not p.startswith("phases/")  # harness state, always touched
        and not path_match_any(p, globs)
    ]
    phase["out_of_scope_files"] = out_of_scope
    save_phase(phase)
    if out_of_scope:
        log_event({"event": "scope_check", "phase_id": phase_id, "out_of_scope": out_of_scope[:50]})
        print(
            f"  → scope check: {len(out_of_scope)} changed file(s) outside the "
            f"declared `files` globs — flagged for review"
        )
    return out_of_scope


def run_gates(phase: dict) -> int:
    for gate in phase.get("gates", []):
        print(f"  → {gate}")
        returncode, _stdout, stderr = _run_command(gate, capture=False)
        if returncode != 0:
            if returncode == 124:
                print(stderr, file=sys.stderr)
            print(f"gate failed: {gate}", file=sys.stderr)
            return 1
    return 0


def run_smoke(phase: dict, phase_id: str, *, require_retro_followup: bool) -> int:
    """Run smoke_cmd (or the documented-skip path). Records the outcome
    in phase["smoke_result"] so the retro drafter can cite it.

    require_retro_followup: the manual `finish` path demands the skip be
    documented in an existing retro; the one-shot pipeline instead
    injects the followup into the retro it drafts afterwards.
    """
    smoke_cmd = phase.get("smoke_cmd")
    if not smoke_cmd:
        return 0

    skip_reason = os.environ.get("HARNESS_SKIP_SMOKE")
    if skip_reason:
        if require_retro_followup and not has_skip_followup(retro_followups(phase_id)):
            print(
                "SMOKE SKIP REFUSED: HARNESS_SKIP_SMOKE is set but the retro's "
                "`followups` array does not contain an entry starting with "
                f"'{SMOKE_SKIP_FOLLOWUP_PREFIX}'. Document the skip in the "
                "retro so future agents see the gap.",
                file=sys.stderr,
            )
            return 2
        log_event(
            {
                "event": "smoke_skipped",
                "phase_id": phase_id,
                "smoke_cmd": smoke_cmd,
                "reason": skip_reason,
            }
        )
        phase["smoke_result"] = {
            "ts": now_iso(),
            "result": "skipped",
            "cmd": smoke_cmd,
            "skip_reason": skip_reason,
        }
        save_phase(phase)
        print(f"  → smoke skipped: {skip_reason}")
        return 0

    print(f"  → smoke: {smoke_cmd}")
    returncode, stdout, stderr = _run_command(smoke_cmd)
    if returncode != 0:
        combined = (stdout + stderr).splitlines()
        tail = "\n".join(combined[-SMOKE_TAIL_LINES:])
        print(f"smoke failed (exit {returncode}): {smoke_cmd}", file=sys.stderr)
        print("--- smoke output tail ---", file=sys.stderr)
        print(tail, file=sys.stderr)
        print(
            "\nFix the smoke failure before finishing this phase. To document "
            "a legitimate skip (no docker, infra not provisioned, etc.), set "
            f"HARNESS_SKIP_SMOKE=<reason>; the pipeline records it as a "
            f"'{SMOKE_SKIP_FOLLOWUP_PREFIX} <reason>' retro followup.",
            file=sys.stderr,
        )
        return 1
    log_event({"event": "smoke_passed", "phase_id": phase_id, "smoke_cmd": smoke_cmd})
    phase["smoke_result"] = {"ts": now_iso(), "result": "pass", "cmd": smoke_cmd}
    save_phase(phase)
    return 0
