#!/usr/bin/env python3
"""Phase runner for the in-repo AI-development harness — CLI entry point.

All logic lives in the `harness` package next to this file (one module
per concern; see scripts/harness/__init__.py for the map). This file
only bootstraps the import path and dispatches.

A phase is a JSON file under `phases/` with this shape:

    {
      "id": "01-foundation",
      "title": "Bootstrap the project skeleton",
      "status": "pending" | "in_progress" | "completed" | "exhausted" | "needs_human",
      "depends_on": [],
      "acceptance": ["criterion 1", "criterion 2"],
      "files": ["glob/of/files/this/phase/touches/**"],
      "gates": ["npm test", "npm run typecheck"],
      "verification_cmd": "test -f src/foo.ts && npm test",
      "smoke_cmd": "INTEGRATION=1 npm run test:integration",
      "security_review": false,
      "agent_cmds": {"reviewer": "claude --permission-mode auto --model opus"},
      "notes": ""
    }

Alongside each `<id>.json` lives `<id>.md` — the writer prompt (see
phases/PHASE_TEMPLATE.md for the required sections).

The primary entry point is the ONE-SHOT pipeline:

    python3 scripts/execute.py run <phase-id>

which executes, in order, persisting progress after each stage so an
interrupted run resumes where it stopped:

    precheck -> lint -> write (retry loop) -> gates -> smoke
             -> review (blocking, fresh-context) -> retro (agent draft)
             -> commit (local only)

Granular subcommands (`start`, `finish`, `lint`, `review`, `retro`)
remain available for debugging and manual recovery.

Environment:
    HARNESS_MAX_ATTEMPTS   override writer retry budget
    HARNESS_CLAUDE_CMD     global agent command for every spawned role
                           (default `claude --permission-mode auto
                           --model opus`)
    HARNESS_<ROLE>_CMD     per-role override: HARNESS_WRITER_CMD,
                           HARNESS_FIXER_CMD, HARNESS_REVIEWER_CMD,
                           HARNESS_RETRO_CMD (beats everything else;
                           see harness/agents.py for the full chain,
                           which also reads `agent_cmds` from the phase
                           JSON and harness.config.json)
    HARNESS_SKIP_SMOKE     documented smoke skip (reason required)
    HARNESS_PARENT         set internally on spawned agents; any
                           execute.py invocation with it refuses to run
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from harness.cli import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main())
