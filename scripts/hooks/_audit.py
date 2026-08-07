"""Audit log helper for PreToolUse hooks and harness runtime events.

Two layers:

  log_event(payload, *, repo_root=None)
      Generic appender. Used by the retry loop (and any future event
      type — retro consumption, gate failures, etc.).

  log_denial(hook, tool, input_summary, reason, *, repo_root=None)
      Convenience wrapper for hook deny decisions. Truncates
      input_summary to 200 chars. Builds the canonical denial event
      shape: { hook, tool, input_summary, decision: 'deny', reason }.

Both layers append one JSON object per line to
<repo_root>/.harness/audit.jsonl with an ISO 8601 UTC `ts` field
(auto-added if the caller did not include one).

Fail-open: any IO failure (read-only repo, .harness path squatted by
a regular file, permission error) is swallowed silently so the
caller's primary contract — typically a hook deny or a retry
decision — is not affected by logging IO problems.

Allow decisions are intentionally NOT logged via these helpers —
volume is too high and signal value too low for retro purposes.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

_AUDIT_DIR_NAME = ".harness"
_AUDIT_FILE_NAME = "audit.jsonl"
_INPUT_SUMMARY_MAX = 200


def resolve_repo_root(payload_cwd: str | None = None) -> Path:
    """Resolve the project root.

    Priority: CLAUDE_PROJECT_DIR env var (Anthropic-recommended), then
    the cwd field from the PreToolUse payload, then process cwd.
    """
    candidate = os.environ.get("CLAUDE_PROJECT_DIR") or payload_cwd or os.getcwd()
    return Path(candidate).resolve()


def _write_jsonl(repo_root: Path, event: dict) -> None:
    """Core write logic. Fail-open."""
    try:
        if "ts" not in event:
            event = {**event, "ts": datetime.now(timezone.utc).isoformat(timespec="seconds")}
        audit_dir = repo_root / _AUDIT_DIR_NAME
        audit_dir.mkdir(parents=True, exist_ok=True)
        with (audit_dir / _AUDIT_FILE_NAME).open("a", encoding="utf-8") as f:
            f.write(json.dumps(event, ensure_ascii=False, default=str) + "\n")
    except Exception:
        # Fail-open: a logging failure must not change the caller's decision.
        pass


def log_event(payload: dict, *, repo_root: Path | None = None) -> None:
    """Append an arbitrary event dict to .harness/audit.jsonl.

    Use for retry, exhaustion, and any future harness-runtime events.
    Auto-adds `ts` if absent. Reorders nothing.
    """
    root = repo_root if repo_root is not None else resolve_repo_root()
    _write_jsonl(root, payload)


def log_denial(
    hook: str,
    tool: str,
    input_summary: str,
    reason: str,
    *,
    repo_root: Path | None = None,
) -> None:
    """Append a hook-denial event. Truncates input_summary to 200 chars."""
    if len(input_summary) > _INPUT_SUMMARY_MAX:
        input_summary = input_summary[:_INPUT_SUMMARY_MAX]
    log_event(
        {
            "hook": hook,
            "tool": tool,
            "input_summary": input_summary,
            "decision": "deny",
            "reason": reason,
        },
        repo_root=repo_root,
    )


def append_audit(
    repo_root: Path,
    hook: str,
    tool: str,
    tool_input: dict,
    reason: str,
) -> None:
    """Back-compat shim used by the hooks. Wraps log_denial.

    Difference from log_denial: takes the raw `tool_input` dict and
    serializes it to JSON before truncating. Keeps the existing hook
    call sites unchanged.
    """
    summary = json.dumps(tool_input, default=str, ensure_ascii=False)
    log_denial(hook, tool, summary, reason, repo_root=repo_root)
