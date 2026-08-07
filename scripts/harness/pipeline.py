"""The one-shot pipeline (`run`) and the commit stage."""

from __future__ import annotations

import os
import subprocess
import sys

from harness.context import REPO_ROOT, get_config, log_event, now_iso
from harness.lint import lint_phase
from harness.retro import draft_retro
from harness.review import review_stage
from harness.runner import (
    handle_exhaustion,
    resolve_max_attempts,
    run_gates,
    run_smoke,
    run_verification,
    write_loop,
)
from harness.state import STAGES, save_phase


def commit_stage(phase: dict, phase_id: str) -> int:
    config = get_config()
    timeout = int(config["command_timeout_sec"])
    num = phase_id.split("-")[0]
    message = config["commit_message_format"].format(id=phase_id, num=num, title=phase["title"])
    trailers = config.get("commit_trailers") or []
    if trailers:
        message += "\n\n" + "\n".join(trailers)

    try:
        add = subprocess.run("git add -A", shell=True, cwd=REPO_ROOT, timeout=timeout)
        if add.returncode != 0:
            print("git add failed", file=sys.stderr)
            return 1
        dirty = subprocess.run(
            "git status --porcelain",
            shell=True,
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=timeout,
        ).stdout.strip()
        if not dirty:
            print("  → nothing to commit")
            return 0
        commit = subprocess.run(
            ["git", "commit", "-m", message],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as e:
        print(f"git command timed out after {timeout}s: {e.cmd}", file=sys.stderr)
        return 1
    if commit.returncode != 0:
        print(f"git commit failed:\n{commit.stdout}{commit.stderr}", file=sys.stderr)
        return 1
    print(f"  → committed: {message.splitlines()[0]}")
    return 0


def _dirty_tree_files() -> list[str]:
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
        return []
    dirty = []
    for line in proc.stdout.splitlines():
        if not line.strip():
            continue
        path = line[3:].split(" -> ")[-1].strip('"')
        # Harness-operator files are legitimately edited right before a
        # run (/harness writes phase files, the operator tweaks config);
        # they are not writer output and the scope guard exempts them too.
        if path.startswith("phases/") or path == "harness.config.json":
            continue
        dirty.append(line)
    return dirty


def run_pipeline(
    phase: dict,
    phase_id: str,
    spec_text: str | None,
    restart: bool,
    allow_dirty: bool = False,
) -> int:
    """One-shot phase execution: lint -> write -> gates -> smoke ->
    review -> retro -> commit. Resumes from the last completed stage
    unless restart is given.
    """
    if restart:
        phase.pop("stage", None)
        phase.pop("review_cycles", None)
        save_phase(phase)

    done_stage = phase.get("stage")
    start_idx = STAGES.index(done_stage) + 1 if done_stage in STAGES else 0

    # Fresh runs must start from a clean tree: the scope guard and the
    # review brief attribute every uncommitted change to this phase, so
    # pre-existing dirt would be reviewed as the writer's work. Resumes
    # and restarts are mid-phase by definition — their dirt is the work.
    if start_idx == 0 and not restart and not allow_dirty:
        dirty = _dirty_tree_files()
        if dirty:
            print(
                f"DIRTY TREE: {len(dirty)} uncommitted change(s) predate this "
                f"run — the scope guard and reviewer would attribute them to "
                f"this phase. Commit or stash first, or pass --allow-dirty.",
                file=sys.stderr,
            )
            for line in dirty[:20]:
                print(f"  {line}", file=sys.stderr)
            return 2

    def mark(stage: str) -> None:
        phase["stage"] = stage
        save_phase(phase)

    for stage in STAGES[start_idx:]:
        print(f"[{phase_id}] stage: {stage}")

        if stage == "lint":
            errors = lint_phase(phase, spec_text)
            if errors:
                print(f"LINT FAILED for {phase_id}:", file=sys.stderr)
                for e in errors:
                    print(f"  {e}", file=sys.stderr)
                print(
                    "\nFix the phase JSON / .md and re-run. No agents were "
                    "spawned; nothing was mutated.",
                    file=sys.stderr,
                )
                return 2
            phase["status"] = "in_progress"
            phase["attempts"] = 0
            phase["run_started_at"] = now_iso()
            log_event({"event": "run_started", "phase_id": phase_id})

        elif stage == "write":
            # Phase-level TDD: the verifier must FAIL before the work
            # exists. A verifier that is already green is tautological
            # (empty-workspace test runners, file-existence checks on
            # committed files) and would pass a writer that did nothing.
            if not restart and os.environ.get("HARNESS_ALLOW_GREEN_VERIFIER") != "1":
                verification_cmd = phase.get(
                    "verification_cmd", get_config()["default_verification_cmd"]
                )
                rc0, _tail = run_verification(verification_cmd)
                if rc0 == 0:
                    log_event({"event": "verifier_already_green", "phase_id": phase_id})
                    print(
                        f"VERIFIER ALREADY GREEN: `{verification_cmd}` passes "
                        f"before any work was done, so it cannot prove this "
                        f"phase's work. Make it assert something the phase "
                        f"will create, or set HARNESS_ALLOW_GREEN_VERIFIER=1 "
                        f"to proceed anyway.",
                        file=sys.stderr,
                    )
                    return 2
            succeeded, last_error = write_loop(phase, phase_id)
            if not succeeded:
                handle_exhaustion(phase, phase_id, last_error)
                print(
                    f"EXHAUSTED: {phase_id} failed verification after "
                    f"{resolve_max_attempts(phase)} attempts",
                    file=sys.stderr,
                )
                return 2

        elif stage == "gates":
            if run_gates(phase) != 0:
                print(
                    "gates failed after verification passed — inspect and "
                    "re-run `run` to resume from the gates stage.",
                    file=sys.stderr,
                )
                # Persist resume point at the previous stage.
                phase["stage"] = "write"
                save_phase(phase)
                return 1

        elif stage == "smoke":
            rc = run_smoke(phase, phase_id, require_retro_followup=False)
            if rc != 0:
                phase["stage"] = "gates"
                save_phase(phase)
                return rc

        elif stage == "review":
            rc = review_stage(phase, phase_id)
            if rc != 0:
                return rc

        elif stage == "retro":
            if draft_retro(phase, phase_id) != 0:
                return 1

        elif stage == "commit":
            # Write the phase's final state BEFORE committing so the
            # commit captures it and the tree ends clean. On commit
            # failure, revert so a re-run resumes at this stage.
            phase["status"] = "completed"
            phase["stage"] = "commit"
            save_phase(phase)
            if commit_stage(phase, phase_id) != 0:
                phase["status"] = "in_progress"
                phase["stage"] = "retro"
                save_phase(phase)
                return 1
            continue

        mark(stage)
    log_event({"event": "run_completed", "phase_id": phase_id})
    print(
        f"completed: {phase_id} — review the drafted retro at "
        f"phases/{phase_id}.retro.json and the local commit before pushing"
    )
    return 0
