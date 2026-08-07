"""Auto-append exhausted-phase items to docs/BACKLOG.md.

Called from the retry-loop exhaustion path in execute.py. Kept
separate so it is testable in isolation without spinning up a phase
or subprocess. Uses simple string-find on the `## Active` heading
rather than a markdown parser — BACKLOG.md is small and stable.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

ACTIVE_HEADING = "## Active"


def append_exhausted_item(
    backlog_path: Path,
    phase_id: str,
    max_attempts: int,
    verification_cmd: str,
    last_error_summary: str,
    label: str = "retry exhausted",
) -> str | None:
    """Insert a P1 'phase <label>' item at the top of `## Active`.

    Returns None on success (item inserted or duplicate-skipped).
    Returns an error string when the file is missing or the
    `## Active` section is absent. The file is NOT modified on error.

    Duplicate detection: if the file already contains the phrase
    "Phase <phase_id> <label>", insertion is silently skipped. The
    label is part of the dedup key so distinct exhaustion sources
    (retry loop vs review cycle) never swallow each other's items.
    """
    if not backlog_path.exists():
        return f"BACKLOG.md not found at {backlog_path}"

    content = backlog_path.read_text()

    if f"Phase {phase_id} {label}" in content:
        return None  # silent dedup

    idx = content.find(ACTIVE_HEADING)
    if idx == -1:
        return f"BACKLOG.md missing '{ACTIVE_HEADING}' section"

    # Insert position: right after the newline that ends the heading line.
    newline_idx = content.find("\n", idx)
    if newline_idx == -1:
        return f"BACKLOG.md '{ACTIVE_HEADING}' heading has no newline"
    insert_pos = newline_idx + 1

    today = datetime.now(timezone.utc).date().isoformat()
    error_line = last_error_summary.replace("\n", " ").strip()[:120] or "(no error captured)"
    item = (
        f"\n- [ ] [P1] Phase {phase_id} {label} after {max_attempts} "
        f"attempts on `{verification_cmd}`. Last error: `{error_line}`. "
        f"Source: harness_loop, {today}.\n"
    )

    backlog_path.write_text(content[:insert_pos] + item + content[insert_pos:])
    return None
