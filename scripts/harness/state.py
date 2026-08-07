"""Phase JSON state: load, save, find, statuses, stage order, run lock."""

from __future__ import annotations

import contextlib
import json
import os
import sys
from pathlib import Path

from harness.context import PHASES_DIR, REPO_ROOT

VALID_STATUSES = ("pending", "in_progress", "completed", "exhausted", "needs_human")

# Pipeline stages, in execution order. phase["stage"] records the last
# COMPLETED stage; `run` resumes at the next one.
STAGES = ("lint", "write", "gates", "smoke", "review", "retro", "commit")

STATUS_MARKERS = {
    "completed": "✓",
    "in_progress": "→",
    "pending": "·",
    "exhausted": "✗",
    "needs_human": "!",
}


def load_phases() -> list[dict]:
    if not PHASES_DIR.exists():
        return []
    phases = []
    for p in sorted(PHASES_DIR.glob("*.json")):
        if p.name == "RETRO_TEMPLATE.json" or p.name.endswith(".retro.json"):
            continue
        with p.open() as f:
            data = json.load(f)
        data["_path"] = str(p)
        phases.append(data)
    return phases


def save_phase(phase: dict) -> None:
    """Atomic save: write a sibling temp file, then os.replace it in.

    A crash mid-write must never leave a truncated phase JSON — that
    would strand the pipeline with unparseable state.
    """
    path = Path(phase.pop("_path"))
    try:
        tmp = path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(phase, indent=2) + "\n")
        os.replace(tmp, path)
    finally:
        phase["_path"] = str(path)


def find_phase(phase_id: str) -> dict:
    for p in load_phases():
        if p["id"] == phase_id:
            return p
    print(f"unknown phase: {phase_id}", file=sys.stderr)
    sys.exit(2)


# ---------------------------------------------------------------------------
# run lock — one `run` per phase at a time
# ---------------------------------------------------------------------------

_LOCKS_DIR = REPO_ROOT / ".harness" / "locks"


def _pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def acquire_run_lock(phase_id: str) -> str | None:
    """Take the per-phase run lock. Returns None on success, or an
    error message when another live process holds it.

    The lockfile is created atomically WITH its pid content (temp file
    + os.link), so a competing process can never observe an empty lock
    and wrongly steal a live one. A lock whose pid is no longer alive
    is stale (crashed run) and is stolen silently — resume-after-crash
    must not require manual lockfile cleanup.
    """
    _LOCKS_DIR.mkdir(parents=True, exist_ok=True)
    lock_path = _LOCKS_DIR / f"{phase_id}.lock"
    tmp_path = _LOCKS_DIR / f".{phase_id}.{os.getpid()}.tmp"
    tmp_path.write_text(str(os.getpid()))
    try:
        for _ in range(5):
            try:
                os.link(tmp_path, lock_path)
                return None
            except FileExistsError:
                try:
                    holder = int(lock_path.read_text().strip() or 0)
                except (OSError, ValueError):
                    holder = 0
                if holder and _pid_alive(holder) and holder != os.getpid():
                    return (
                        f"phase {phase_id} is already being run by pid {holder} "
                        f"(lock: {lock_path}). If that process is gone, delete "
                        f"the lock file and retry."
                    )
                with contextlib.suppress(FileNotFoundError):
                    lock_path.unlink()
        return f"could not acquire lock for {phase_id} after 5 attempts: {lock_path}"
    finally:
        with contextlib.suppress(FileNotFoundError):
            tmp_path.unlink()


def release_run_lock(phase_id: str) -> None:
    with contextlib.suppress(FileNotFoundError):
        (_LOCKS_DIR / f"{phase_id}.lock").unlink()
