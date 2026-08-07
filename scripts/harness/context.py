"""Repo paths, config access, and constants shared across the harness."""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
PHASES_DIR = REPO_ROOT / "phases"

_SCRIPTS_DIR = Path(__file__).resolve().parents[1]
for _p in (str(_SCRIPTS_DIR), str(_SCRIPTS_DIR / "hooks")):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from _audit import log_event as _log_event  # noqa: E402
from _backlog import append_exhausted_item  # noqa: E402
from _config import load_config  # noqa: E402

__all__ = [
    "REPO_ROOT",
    "PHASES_DIR",
    "get_config",
    "now_iso",
    "log_event",
    "append_exhausted_item",
    "HARNESS_PARENT_ENV",
    "ERROR_TAIL_LINES",
    "ERROR_SUMMARY_MAX",
    "SMOKE_TAIL_LINES",
    "SMOKE_SKIP_FOLLOWUP_PREFIX",
]

# Nested-invocation guard. Agent-spawning stages set this in the
# subprocess env so a spawned agent cannot recursively invoke
# `execute.py` subcommands (e.g. self-finishing its own phase, which a
# writer once did — skipping the review gate entirely).
HARNESS_PARENT_ENV = "HARNESS_PARENT"

ERROR_TAIL_LINES = 50
ERROR_SUMMARY_MAX = 500
SMOKE_TAIL_LINES = 50
SMOKE_SKIP_FOLLOWUP_PREFIX = "smoke skipped:"


def get_config() -> dict:
    return load_config(REPO_ROOT)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def log_event(payload: dict) -> None:
    _log_event(payload, repo_root=REPO_ROOT)
