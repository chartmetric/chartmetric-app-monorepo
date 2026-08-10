"""Load harness.config.json with defaults.

Every project-tunable knob of the harness lives here. The repo ships a
`harness.config.json` at the root; missing keys fall back to DEFAULTS,
so a minimal config (or none at all) still yields a working harness.

Kept as a sibling module so hooks (which run as standalone scripts via
Claude Code PreToolUse) and the phase runner share one loader.
"""

from __future__ import annotations

import json
from pathlib import Path

CONFIG_FILE_NAME = "harness.config.json"

DEFAULTS: dict = {
    # Identity — used in prompts and commit messages only.
    "project_name": "my-project",
    # Docs that must have substantive content before phases can run.
    "required_docs": ["docs/PRD.md", "docs/ARCHITECTURE.md"],
    # Docs that are recommended but not gated, as {path: how-to-fill hint}.
    # Reported by precheck and never fatal — for docs a project bootstraps
    # on first use, which cannot be required before that use happens.
    "advisory_docs": {},
    "agents_file": "AGENTS.md",
    "agents_sections": [2, 3, 4],
    "min_substantive_lines": 3,
    # Runtime loop.
    "default_verification_cmd": "python3 -m unittest discover tests -v",
    "max_attempts": 5,
    # Subprocess ceilings — a hung command must not hang the pipeline.
    "agent_timeout_sec": 3600,
    "command_timeout_sec": 1800,
    # Review stage (one-shot pipeline).
    "max_review_cycles": 2,
    # Per-role agent commands (writer / fixer / reviewer / retro).
    # Empty = every role uses execute.py's DEFAULT_AGENT_CMD. Env vars
    # (HARNESS_<ROLE>_CMD, HARNESS_CLAUDE_CMD) outrank these; a phase
    # JSON `agent_cmds` outranks this file.
    "agent_cmds": {},
    # Filename conventions the project's test runner(s) actually pick up.
    # Used by `lint` to catch verifier path typos before burning attempts.
    "test_file_conventions": ["*.test.*", "*.spec.*", "test_*.py", "*_test.py"],
    # Backlog file the exhaustion / needs-human paths append to.
    "backlog_path": "docs/BACKLOG.md",
    # Auto-commit at the end of a successful `run`.
    "commit_message_format": "phase({num}): {title}",
    "commit_trailers": [],
}

_cache: dict[str, dict] = {}


def _validate_types(overrides: dict) -> None:
    """Type-check known keys against DEFAULTS. Unknown keys pass through.

    A `"max_attempts": "5"` (string) would otherwise fail deep inside
    the pipeline; fail loudly at load instead.
    """
    errors = []
    for key, value in overrides.items():
        if key not in DEFAULTS:
            continue
        expected = type(DEFAULTS[key])
        if expected is int and isinstance(value, bool):
            errors.append(f"{key}: expected int, got bool")
        elif not isinstance(value, expected):
            errors.append(f"{key}: expected {expected.__name__}, got {type(value).__name__}")
    if errors:
        raise ValueError(f"{CONFIG_FILE_NAME} has invalid types: " + "; ".join(errors))


def load_config(repo_root: Path) -> dict:
    """Return DEFAULTS shallow-merged with <repo_root>/harness.config.json.

    Unknown keys in the file are preserved (forward-compat). A malformed
    file or a wrongly-typed known key is a hard error — a
    silently-ignored config is worse than a crash at harness entry.
    """
    key = str(Path(repo_root).resolve())
    if key in _cache:
        return _cache[key]
    config = dict(DEFAULTS)
    path = Path(repo_root) / CONFIG_FILE_NAME
    if path.exists():
        overrides = json.loads(path.read_text())
        _validate_types(overrides)
        config.update(overrides)
    _cache[key] = config
    return config


def clear_cache() -> None:
    """Test helper — configs are cached per repo root."""
    _cache.clear()
