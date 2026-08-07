"""Unit tests for the _audit helper module.

Tests the helper in isolation (no hook subprocess). Verifies schema,
truncation, append behavior, and fail-open semantics.

Run:
    python3 -m unittest discover tests -v
"""

from __future__ import annotations

import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts/hooks"))
from _audit import append_audit, log_denial, log_event, resolve_repo_root  # noqa: E402


class TestAppendAudit(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="harness-audit-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_creates_harness_directory(self) -> None:
        append_audit(self.tmp, "h", "Bash", {"command": "x"}, "r")
        self.assertTrue((self.tmp / ".harness").is_dir())

    def test_writes_one_jsonl_line(self) -> None:
        append_audit(self.tmp, "dangerous_cmd_guard", "Bash", {"command": "rm -rf /"}, "danger")
        path = self.tmp / ".harness/audit.jsonl"
        lines = path.read_text().splitlines()
        self.assertEqual(len(lines), 1)
        ev = json.loads(lines[0])
        self.assertEqual(
            set(ev.keys()), {"ts", "hook", "tool", "input_summary", "decision", "reason"}
        )
        self.assertEqual(ev["hook"], "dangerous_cmd_guard")
        self.assertEqual(ev["tool"], "Bash")
        self.assertEqual(ev["decision"], "deny")
        self.assertEqual(ev["reason"], "danger")
        self.assertIn("rm -rf /", ev["input_summary"])

    def test_ts_is_iso8601_utc(self) -> None:
        append_audit(self.tmp, "h", "Bash", {"command": "x"}, "r")
        ev = json.loads((self.tmp / ".harness/audit.jsonl").read_text().splitlines()[0])
        # ISO 8601 UTC with seconds precision ends in +00:00
        self.assertTrue(ev["ts"].endswith("+00:00"), f"ts={ev['ts']!r}")
        self.assertEqual(len(ev["ts"]), 25)  # "YYYY-MM-DDTHH:MM:SS+00:00"

    def test_input_summary_truncated_to_200(self) -> None:
        long_input = {"command": "x" * 500}
        append_audit(self.tmp, "h", "Bash", long_input, "r")
        ev = json.loads((self.tmp / ".harness/audit.jsonl").read_text().splitlines()[0])
        self.assertLessEqual(len(ev["input_summary"]), 200)

    def test_appends_in_order(self) -> None:
        for i in range(5):
            append_audit(self.tmp, "h", "Bash", {"command": f"cmd{i}"}, f"reason{i}")
        lines = (self.tmp / ".harness/audit.jsonl").read_text().splitlines()
        self.assertEqual(len(lines), 5)
        for i, line in enumerate(lines):
            self.assertEqual(json.loads(line)["reason"], f"reason{i}")

    def test_fail_open_when_harness_is_a_file(self) -> None:
        (self.tmp / ".harness").write_text("blocker")
        # Should not raise.
        append_audit(self.tmp, "h", "Bash", {"command": "x"}, "r")
        # No log written, but no exception.
        self.assertFalse((self.tmp / ".harness/audit.jsonl").exists())

    def test_fail_open_returns_none(self) -> None:
        (self.tmp / ".harness").write_text("blocker")
        result = append_audit(self.tmp, "h", "Bash", {"command": "x"}, "r")
        self.assertIsNone(result)


class TestLogEvent(unittest.TestCase):
    """Generic event logger (added for retry-loop / exhaustion events)."""

    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="harness-logevent-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_accepts_arbitrary_dict(self) -> None:
        log_event(
            {"event": "retry_triggered", "phase_id": "01-foo", "attempt": 1},
            repo_root=self.tmp,
        )
        ev = json.loads((self.tmp / ".harness/audit.jsonl").read_text().splitlines()[0])
        self.assertEqual(ev["event"], "retry_triggered")
        self.assertEqual(ev["phase_id"], "01-foo")
        self.assertEqual(ev["attempt"], 1)

    def test_auto_adds_ts_when_missing(self) -> None:
        log_event({"event": "x"}, repo_root=self.tmp)
        ev = json.loads((self.tmp / ".harness/audit.jsonl").read_text().splitlines()[0])
        self.assertIn("ts", ev)
        self.assertTrue(ev["ts"].endswith("+00:00"))

    def test_preserves_caller_ts(self) -> None:
        log_event({"event": "x", "ts": "2026-01-01T00:00:00+00:00"}, repo_root=self.tmp)
        ev = json.loads((self.tmp / ".harness/audit.jsonl").read_text().splitlines()[0])
        self.assertEqual(ev["ts"], "2026-01-01T00:00:00+00:00")

    def test_log_denial_writes_full_schema(self) -> None:
        log_denial(
            "dangerous_cmd_guard", "Bash", '{"command": "rm -rf /"}', "danger", repo_root=self.tmp
        )
        ev = json.loads((self.tmp / ".harness/audit.jsonl").read_text().splitlines()[0])
        self.assertEqual(
            set(ev.keys()), {"ts", "hook", "tool", "input_summary", "decision", "reason"}
        )
        self.assertEqual(ev["decision"], "deny")

    def test_log_event_fail_open_when_harness_is_a_file(self) -> None:
        (self.tmp / ".harness").write_text("blocker")
        # Must not raise.
        log_event({"event": "retry_succeeded", "phase_id": "01"}, repo_root=self.tmp)


class TestResolveRepoRoot(unittest.TestCase):
    def setUp(self) -> None:
        self._saved_env = os.environ.pop("CLAUDE_PROJECT_DIR", None)

    def tearDown(self) -> None:
        os.environ.pop("CLAUDE_PROJECT_DIR", None)
        if self._saved_env is not None:
            os.environ["CLAUDE_PROJECT_DIR"] = self._saved_env

    def test_env_var_takes_precedence(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            os.environ["CLAUDE_PROJECT_DIR"] = tmp
            self.assertEqual(resolve_repo_root("/other/path"), Path(tmp).resolve())

    def test_falls_back_to_payload_cwd(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(resolve_repo_root(tmp), Path(tmp).resolve())

    def test_falls_back_to_process_cwd(self) -> None:
        result = resolve_repo_root(None)
        self.assertEqual(result, Path.cwd().resolve())


if __name__ == "__main__":
    unittest.main()
