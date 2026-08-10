"""Argparse wiring and thin command handlers."""

from __future__ import annotations

import argparse
import os
import sys

from harness.context import HARNESS_PARENT_ENV, PHASES_DIR
from harness.docs_gate import precheck_advisories, precheck_failures
from harness.doctor import run_doctor
from harness.lint import lint_phase
from harness.pipeline import run_pipeline
from harness.retro import draft_retro, validate_retro
from harness.review import review_stage
from harness.runner import (
    handle_exhaustion,
    resolve_max_attempts,
    run_gates,
    run_smoke,
    write_loop,
)
from harness.state import (
    STATUS_MARKERS,
    acquire_run_lock,
    find_phase,
    load_phases,
    release_run_lock,
    save_phase,
)


def _with_phase_lock(phase_id: str, fn) -> int:
    """Every phase-mutating subcommand takes the same per-phase lock as
    `run` — a concurrent debug command must not clobber a live run's
    state (save_phase is last-writer-wins)."""
    lock_err = acquire_run_lock(phase_id)
    if lock_err:
        print(lock_err, file=sys.stderr)
        return 2
    try:
        return fn()
    finally:
        release_run_lock(phase_id)


def _print_advisories() -> None:
    advisories = precheck_advisories()
    if not advisories:
        return
    print("\nprecheck advisories — recommended docs are thin or absent:")
    for a in advisories:
        print(a)
    print(
        "\nThese do not block a run. A phase grounded in a doc listed\n"
        "here will be weaker for its absence."
    )


def cmd_precheck(_args: argparse.Namespace) -> int:
    failures = precheck_failures()
    if failures:
        print("PRECHECK FAILED — required docs are still skeletons:", file=sys.stderr)
        for f in failures:
            print(f, file=sys.stderr)
        print(
            "\nFill these docs collaboratively with the user before running\n"
            "`/harness` or any phase. The harness will not advance past\n"
            "skeleton state.",
            file=sys.stderr,
        )
        _print_advisories()
        return 2
    print("precheck ok: required docs have substantive content")
    _print_advisories()
    return 0


def cmd_status(_args: argparse.Namespace) -> int:
    phases = load_phases()
    if not phases:
        print("No phases defined yet. Use /harness in Claude Code to generate.")
        return 0
    for p in phases:
        marker = STATUS_MARKERS.get(p["status"], "?")
        stage = f" [{p['stage']}]" if p.get("stage") and p["status"] == "in_progress" else ""
        print(f"  {marker} {p['id']:<24} {p['title']}{stage}")
    return 0


def cmd_current(_args: argparse.Namespace) -> int:
    for p in load_phases():
        if p["status"] != "completed":
            print(p["id"])
            return 0
    print("(all phases complete)")
    return 0


def cmd_lint(args: argparse.Namespace) -> int:
    phase = find_phase(args.phase_id)
    spec_path = PHASES_DIR / f"{args.phase_id}.md"
    spec_text = spec_path.read_text() if spec_path.exists() else None
    errors = lint_phase(phase, spec_text)
    if errors:
        print(f"LINT FAILED for {args.phase_id}:", file=sys.stderr)
        for e in errors:
            print(f"  {e}", file=sys.stderr)
        return 2
    print(f"lint ok: {args.phase_id}")
    return 0


def cmd_start(args: argparse.Namespace) -> int:
    """Writer retry loop only (debug / manual path). `run` is the
    one-shot pipeline and should be preferred.
    """
    if cmd_precheck(args) != 0:
        return 2

    phase = find_phase(args.phase_id)
    spec_path = PHASES_DIR / f"{args.phase_id}.md"
    if not spec_path.exists():
        print(
            f"phase spec missing: phases/{args.phase_id}.md "
            f"(create the markdown prompt file before running `start`)",
            file=sys.stderr,
        )
        return 2

    phase["status"] = "in_progress"
    phase["attempts"] = 0
    save_phase(phase)

    succeeded, last_error_summary = write_loop(phase, args.phase_id)
    if succeeded:
        # Deliberately NOT completed: only `run` (full pipeline) or
        # `finish` (retro + gates + smoke) may complete a phase —
        # `start` alone has run no gates, smoke, or review.
        phase["stage"] = "write"
        save_phase(phase)
        print(
            f"verification passed for {args.phase_id} on attempt "
            f"{phase['attempts']} — phase left in_progress. Complete it "
            f"with `run {args.phase_id}` (resumes after the write stage) "
            f"or `finish {args.phase_id}`."
        )
        return 0

    handle_exhaustion(phase, args.phase_id, last_error_summary)
    print(
        f"EXHAUSTED: {args.phase_id} failed verification after "
        f"{resolve_max_attempts(phase)} attempts",
        file=sys.stderr,
    )
    return 2


def cmd_finish(args: argparse.Namespace) -> int:
    """Manual finish (debug / recovery path): validate retro, run gates
    and smoke, flip completed. The one-shot `run` pipeline subsumes this.
    """
    errors = validate_retro(args.phase_id)
    if errors:
        print("RETRO VALIDATION FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  {e}", file=sys.stderr)
        print(
            "\nWrite a valid retro at "
            f"phases/{args.phase_id}.retro.json (see phases/RETRO_TEMPLATE.json) "
            "before finishing this phase.",
            file=sys.stderr,
        )
        return 2

    phase = find_phase(args.phase_id)
    if run_gates(phase) != 0:
        return 1
    rc = run_smoke(phase, args.phase_id, require_retro_followup=True)
    if rc != 0:
        return rc

    phase["status"] = "completed"
    save_phase(phase)
    print(f"finished: {phase['id']}")
    return 0


def cmd_review(args: argparse.Namespace) -> int:
    phase = find_phase(args.phase_id)
    return review_stage(phase, args.phase_id)


def cmd_retro(args: argparse.Namespace) -> int:
    phase = find_phase(args.phase_id)
    return draft_retro(phase, args.phase_id)


def cmd_run(args: argparse.Namespace) -> int:
    if cmd_precheck(args) != 0:
        return 2

    phase = find_phase(args.phase_id)
    if phase["status"] == "completed":
        print(f"{args.phase_id} is already completed; nothing to do", file=sys.stderr)
        return 2

    spec_path = PHASES_DIR / f"{args.phase_id}.md"
    spec_text = spec_path.read_text() if spec_path.exists() else None
    return _with_phase_lock(
        args.phase_id,
        lambda: run_pipeline(
            phase,
            args.phase_id,
            spec_text,
            getattr(args, "restart", False),
            allow_dirty=getattr(args, "allow_dirty", False),
        ),
    )


def main() -> int:
    # Refuse to run from inside a spawned agent. Agent-spawning stages set
    # HARNESS_PARENT=1; if an agent then tries to invoke execute.py (e.g.
    # `finish` to self-complete its own phase, skipping review), abort.
    if os.environ.get(HARNESS_PARENT_ENV) == "1":
        print(
            "execute.py refuses to run from inside a spawned agent. "
            "HARNESS_PARENT=1 was set by the parent invocation. Agents must "
            "not invoke harness subcommands; the pipeline (or the human "
            "operator) drives stage transitions.",
            file=sys.stderr,
        )
        return 2
    parser = argparse.ArgumentParser(prog="execute.py", description="harness phase runner")
    sub = parser.add_subparsers(dest="action", required=True)
    sub.add_parser("precheck").set_defaults(func=cmd_precheck)
    sub.add_parser("doctor").set_defaults(func=lambda _args: run_doctor())
    sub.add_parser("status").set_defaults(func=cmd_status)
    sub.add_parser("current").set_defaults(func=cmd_current)

    def _locked(func):
        # Phase-mutating debug subcommands share `run`'s per-phase lock.
        def wrapper(args: argparse.Namespace) -> int:
            return _with_phase_lock(args.phase_id, lambda: func(args))

        return wrapper

    for name, func in (
        ("lint", cmd_lint),
        ("start", _locked(cmd_start)),
        ("finish", _locked(cmd_finish)),
        ("review", _locked(cmd_review)),
        ("retro", _locked(cmd_retro)),
    ):
        sp = sub.add_parser(name)
        sp.add_argument("phase_id")
        sp.set_defaults(func=func)
    sp_run = sub.add_parser("run")
    sp_run.add_argument("phase_id")
    sp_run.add_argument(
        "--restart", action="store_true", help="ignore the saved stage and run from the top"
    )
    sp_run.add_argument(
        "--allow-dirty",
        action="store_true",
        help="start a fresh run even with uncommitted changes in the tree",
    )
    sp_run.set_defaults(func=cmd_run)
    args = parser.parse_args()
    return args.func(args)
