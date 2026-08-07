"""Unittest suite for execute.py start retry loop (Pillar 4b — runtime).

Mirrors the harness_loop.ts pseudo-code from the Harness Engineering
guide (page 6): plan → execute → verify → fix, max N attempts. Errors
are fed back into the next attempt's prompt. Exhaustion appends to
docs/BACKLOG.md.

Tests spawn execute.py as a subprocess against a throwaway repo. The
`claude` binary is stubbed via HARNESS_CLAUDE_CMD so no real LLM call
happens during the test run.

Run:
    python3 -m unittest discover tests -v
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

REPO_SRC = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = REPO_SRC / "scripts"

FILLED_DOC = (
    "# Doc\n\n"
    "Substantive content line one.\n"
    "Substantive content line two.\n"
    "Substantive content line three.\n"
)
FILLED_AGENTS = (
    "# AGENTS.md\n\n"
    "## 1. Project context\n- PRD\n\n"
    "## 2. How we write code\nline 1\nline 2\nline 3\n\n"
    "## 3. Git & PR workflow\nline 1\nline 2\nline 3\n\n"
    "## 4. Hooks\nline 1\nline 2\nline 3\n"
)
BACKLOG_SEED = (
    "# Backlog\n\n"
    "## Active\n\n"
    "- [ ] [P2] Some prior item. Source: foo, 2026-05-01.\n\n"
    "## Resolved\n\n"
)

# A claude stub that logs every invocation to HARNESS_TEST_CLAUDE_LOG.
CLAUDE_STUB = textwrap.dedent(
    """\
    #!/usr/bin/env python3
    import os, sys
    log_path = os.environ.get("HARNESS_TEST_CLAUDE_LOG")
    if log_path:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write("---ATTEMPT---\\n")
            for arg in sys.argv[1:]:
                f.write(f"ARG:{arg}\\n")
    """
)


def _make_repo(
    phase_id: str = "01-test",
    verification_cmd: str = "true",
    max_attempts_in_json: int | None = None,
    include_md: bool = True,
    include_backlog: bool = True,
) -> Path:
    tmp = Path(tempfile.mkdtemp(prefix="harness-retry-"))

    shutil.copytree(SCRIPTS_DIR, tmp / "scripts", ignore=shutil.ignore_patterns("__pycache__"))

    (tmp / "docs").mkdir()
    (tmp / "docs/PRD.md").write_text(FILLED_DOC)
    (tmp / "docs/ARCHITECTURE.md").write_text(FILLED_DOC)
    (tmp / "AGENTS.md").write_text(FILLED_AGENTS)

    if include_backlog:
        (tmp / "docs/BACKLOG.md").write_text(BACKLOG_SEED)

    phase = {
        "id": phase_id,
        "title": "Test phase",
        "status": "pending",
        "verification_cmd": verification_cmd,
    }
    if max_attempts_in_json is not None:
        phase["max_attempts"] = max_attempts_in_json
    (tmp / "phases").mkdir()
    (tmp / "phases" / f"{phase_id}.json").write_text(json.dumps(phase, indent=2))

    if include_md:
        (tmp / "phases" / f"{phase_id}.md").write_text("# Phase test\n\nBuild a small foo.\n")

    return tmp


def _run_start(
    tmp: Path,
    phase_id: str,
    extra_env: dict | None = None,
) -> subprocess.CompletedProcess:
    env = {
        **os.environ,
        "CLAUDE_PROJECT_DIR": str(tmp),
        "HARNESS_CLAUDE_CMD": "true",
    }
    if extra_env:
        env.update(extra_env)
    return subprocess.run(
        [sys.executable, str(tmp / "scripts/execute.py"), "start", phase_id],
        cwd=tmp,
        capture_output=True,
        text=True,
        timeout=30,
        env=env,
    )


def _read_audit(tmp: Path) -> list[dict]:
    path = tmp / ".harness/audit.jsonl"
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


class TestRetryLoop(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp: Path | None = None

    def tearDown(self) -> None:
        if self.tmp is not None:
            shutil.rmtree(self.tmp, ignore_errors=True)

    def test_phase_md_missing_exits_2(self) -> None:
        self.tmp = _make_repo(include_md=False)
        result = _run_start(self.tmp, "01-test")
        self.assertEqual(result.returncode, 2)
        self.assertIn(".md", result.stderr)

    def test_passes_on_attempt_1(self) -> None:
        self.tmp = _make_repo(verification_cmd="true")
        result = _run_start(self.tmp, "01-test")
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        events = _read_audit(self.tmp)
        # Exactly one retry_succeeded event, no retry_triggered.
        self.assertEqual([e["event"] for e in events], ["retry_succeeded"])
        self.assertEqual(events[0]["attempt"], 1)
        # Phase JSON updated. `start` deliberately does NOT complete —
        # only `run`/`finish` may (gates/smoke/review haven't run).
        saved = json.loads((self.tmp / "phases/01-test.json").read_text())
        self.assertEqual(saved["status"], "in_progress")
        self.assertEqual(saved["stage"], "write")
        self.assertEqual(saved["attempts"], 1)

    def test_fails_then_passes(self) -> None:
        verif = (
            "sh -c 'n=$(cat .ct 2>/dev/null || echo 0); n=$((n+1)); echo $n > .ct; test $n -ge 2'"
        )
        self.tmp = _make_repo(verification_cmd=verif)
        result = _run_start(self.tmp, "01-test")
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        events = _read_audit(self.tmp)
        self.assertEqual(
            [e["event"] for e in events],
            ["retry_triggered", "retry_succeeded"],
        )
        self.assertEqual(events[0]["attempt"], 1)
        self.assertEqual(events[1]["attempt"], 2)

    def test_fails_5_attempts_exhausts(self) -> None:
        self.tmp = _make_repo(verification_cmd="false")
        result = _run_start(self.tmp, "01-test")
        self.assertEqual(result.returncode, 2, msg=result.stdout + result.stderr)
        events = _read_audit(self.tmp)
        kinds = [e["event"] for e in events]
        self.assertEqual(kinds.count("retry_triggered"), 5)
        self.assertEqual(kinds.count("retry_exhausted"), 1)
        # Backlog updated.
        backlog = (self.tmp / "docs/BACKLOG.md").read_text()
        self.assertIn("Phase 01-test retry exhausted after 5 attempts", backlog)
        self.assertIn("[P1]", backlog)
        # Phase JSON status.
        saved = json.loads((self.tmp / "phases/01-test.json").read_text())
        self.assertEqual(saved["status"], "exhausted")
        self.assertEqual(saved["attempts"], 5)

    def test_max_attempts_env_override(self) -> None:
        self.tmp = _make_repo(verification_cmd="false")
        result = _run_start(self.tmp, "01-test", extra_env={"HARNESS_MAX_ATTEMPTS": "2"})
        self.assertEqual(result.returncode, 2)
        events = _read_audit(self.tmp)
        self.assertEqual([e["event"] for e in events].count("retry_triggered"), 2)
        self.assertEqual([e["event"] for e in events].count("retry_exhausted"), 1)
        # The exhausted event reports the override value.
        exh = next(e for e in events if e["event"] == "retry_exhausted")
        self.assertEqual(exh["max_attempts"], 2)

    def test_error_output_tail_captured(self) -> None:
        # Verification prints 100 numbered lines then exits 1. Only the
        # last ~50 should land in the audit log's error_summary.
        verif = "sh -c 'for i in $(seq 1 100); do echo \"line-$i\"; done; exit 1'"
        self.tmp = _make_repo(verification_cmd=verif, max_attempts_in_json=1)
        result = _run_start(self.tmp, "01-test")
        self.assertEqual(result.returncode, 2)
        events = _read_audit(self.tmp)
        triggered = next(e for e in events if e["event"] == "retry_triggered")
        summary = triggered["error_summary"]
        # Tail content present, head content absent.
        self.assertIn("line-100", summary)
        self.assertNotIn("line-1\n", summary)
        self.assertNotIn("line-25", summary)

    def test_error_feedback_appears_in_next_prompt(self) -> None:
        # Use claude stub that logs every invocation.
        self.tmp = _make_repo(verification_cmd="false", max_attempts_in_json=2)
        stub_path = self.tmp / "claude_stub.py"
        stub_path.write_text(CLAUDE_STUB)
        stub_path.chmod(0o755)
        log_path = self.tmp / "claude.log"

        result = _run_start(
            self.tmp,
            "01-test",
            extra_env={
                "HARNESS_CLAUDE_CMD": f"{sys.executable} {stub_path}",
                "HARNESS_TEST_CLAUDE_LOG": str(log_path),
            },
        )
        self.assertEqual(result.returncode, 2)
        log = log_path.read_text()
        # Two attempts.
        self.assertEqual(log.count("---ATTEMPT---"), 2)
        # Second attempt's prompt must contain the feedback marker.
        parts = log.split("---ATTEMPT---")
        # parts[0] is empty; parts[1] = attempt 1, parts[2] = attempt 2.
        self.assertNotIn("Previous attempt failed verification", parts[1])
        self.assertIn("Previous attempt failed verification", parts[2])
        self.assertIn("Fix only the failures", parts[2])

    def test_claude_called_with_p_flag(self) -> None:
        self.tmp = _make_repo(verification_cmd="true")
        stub_path = self.tmp / "claude_stub.py"
        stub_path.write_text(CLAUDE_STUB)
        stub_path.chmod(0o755)
        log_path = self.tmp / "claude.log"
        _run_start(
            self.tmp,
            "01-test",
            extra_env={
                "HARNESS_CLAUDE_CMD": f"{sys.executable} {stub_path}",
                "HARNESS_TEST_CLAUDE_LOG": str(log_path),
            },
        )
        log = log_path.read_text()
        self.assertIn("ARG:-p", log)

    def test_writer_permission_denied_triggers_retry(self) -> None:
        # Simulate the real-world bug: claude -p emits the "Permission
        # denied. Need approval" string and exits 0. Verifier would
        # otherwise false-positive. The harness must short-circuit to a
        # writer_failed retry instead.
        self.tmp = _make_repo(verification_cmd="true", max_attempts_in_json=2)
        stub_path = self.tmp / "claude_stub_perm.py"
        stub_path.write_text(
            "#!/usr/bin/env python3\n"
            "import sys\n"
            "print('Permission denied. Need approval')\n"
            "sys.exit(0)\n"
        )
        stub_path.chmod(0o755)
        result = _run_start(
            self.tmp,
            "01-test",
            extra_env={"HARNESS_CLAUDE_CMD": f"{sys.executable} {stub_path}"},
        )
        # Verifier ('true') would have passed; we expect exhaustion
        # because every attempt's writer signals a permission failure.
        self.assertEqual(result.returncode, 2, msg=result.stdout + result.stderr)
        events = _read_audit(self.tmp)
        triggered = [e for e in events if e["event"] == "retry_triggered"]
        self.assertEqual(len(triggered), 2)
        for ev in triggered:
            self.assertEqual(ev.get("reason"), "writer_failed")
            self.assertIn("Permission denied", ev["error_summary"])

    def test_writer_nonzero_exit_triggers_retry(self) -> None:
        # Writer exits nonzero — must be treated as failed attempt even
        # if verifier would otherwise pass.
        self.tmp = _make_repo(verification_cmd="true", max_attempts_in_json=1)
        result = _run_start(
            self.tmp,
            "01-test",
            extra_env={"HARNESS_CLAUDE_CMD": "false"},
        )
        self.assertEqual(result.returncode, 2)
        events = _read_audit(self.tmp)
        triggered = next(e for e in events if e["event"] == "retry_triggered")
        self.assertEqual(triggered["reason"], "writer_failed")

    def test_nested_invocation_refused(self) -> None:
        # Writer agents must not self-invoke execute.py subcommands. The
        # guard set by `start` (HARNESS_PARENT=1) makes execute.py
        # refuse any subcommand at main() entry. Phase 03's writer
        # self-finished — this guard closes that hole.
        self.tmp = _make_repo(verification_cmd="true")
        result = _run_start(
            self.tmp,
            "01-test",
            extra_env={"HARNESS_PARENT": "1"},
        )
        self.assertEqual(result.returncode, 2)
        self.assertIn("refuses to run from inside a spawned agent", result.stderr)

    def test_state_attempts_field_written(self) -> None:
        # After exhaustion, the phase JSON's attempts field reflects N.
        self.tmp = _make_repo(verification_cmd="false", max_attempts_in_json=3)
        _run_start(self.tmp, "01-test")
        saved = json.loads((self.tmp / "phases/01-test.json").read_text())
        self.assertEqual(saved["attempts"], 3)
        self.assertEqual(saved["status"], "exhausted")


if __name__ == "__main__":
    unittest.main()
