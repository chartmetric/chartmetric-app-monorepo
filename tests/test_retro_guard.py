"""Unittest suite for execute.py finish retro guard.

Each test builds a throwaway repo with phases/<id>.json (and sometimes
phases/<id>.retro.json) and asserts on finish's exit code:

  0 = retro valid, phase completed
  2 = retro validation failed
  1 = phase gate failed (not exercised here — gates list is empty)

Run:
    python3 -m unittest discover tests -v
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"

VALID_RETRO = {
    "phase_id": "01-test",
    "duration_min": 45,
    "gates_fired": [],
    "git_diff_summary": "1 file changed, 1 insertion(+)",
    "tests_added": 0,
    "tests_passing_total": 87,
    "surprises": [],
    "proposed_rules": [],
    "followups": [],
}


def _run_finish(cwd: Path, phase_id: str) -> tuple[int, str, str]:
    proc = subprocess.run(
        [sys.executable, str(cwd / "scripts/execute.py"), "finish", phase_id],
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=10,
    )
    return proc.returncode, proc.stdout, proc.stderr


def _make_repo(phase: dict, retro: dict | None) -> Path:
    """Build a tmp repo with phases/<id>.json and optionally <id>.retro.json."""
    tmp = Path(tempfile.mkdtemp(prefix="harness-retro-"))
    (tmp / "phases").mkdir()
    (tmp / "phases" / f"{phase['id']}.json").write_text(json.dumps(phase, indent=2))
    if retro is not None:
        (tmp / "phases" / f"{phase['id']}.retro.json").write_text(json.dumps(retro, indent=2))
    shutil.copytree(SCRIPTS_DIR, tmp / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
    # Stub PRD + ARCHITECTURE so precheck would pass if called.
    (tmp / "docs").mkdir()
    (tmp / "docs/PRD.md").write_text("# PRD\n\nproblem statement line 1\nline 2\nline 3\n")
    (tmp / "docs/ARCHITECTURE.md").write_text("# Arch\n\narch line 1\nline 2\nline 3\n")
    return tmp


def _phase(id_: str = "01-test", gates: list[str] | None = None) -> dict:
    return {
        "id": id_,
        "title": "Test phase",
        "status": "in_progress",
        "depends_on": [],
        "acceptance": [],
        "files": [],
        "gates": gates or [],
        "notes": "",
    }


class TestRetroGuard(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp: Path | None = None

    def tearDown(self) -> None:
        if self.tmp is not None:
            shutil.rmtree(self.tmp, ignore_errors=True)

    def test_refuses_when_retro_missing(self) -> None:
        self.tmp = _make_repo(_phase(), retro=None)
        code, _, err = _run_finish(self.tmp, "01-test")
        self.assertEqual(code, 2)
        self.assertIn("retro", err.lower())

    def test_refuses_when_required_key_missing(self) -> None:
        bad = dict(VALID_RETRO)
        del bad["tests_passing_total"]
        self.tmp = _make_repo(_phase(), retro=bad)
        code, _, err = _run_finish(self.tmp, "01-test")
        self.assertEqual(code, 2)
        self.assertIn("tests_passing_total", err)

    def test_refuses_when_phase_id_mismatch(self) -> None:
        bad = dict(VALID_RETRO, phase_id="02-other")
        self.tmp = _make_repo(_phase("01-test"), retro=bad)
        code, _, err = _run_finish(self.tmp, "01-test")
        self.assertEqual(code, 2)
        self.assertIn("phase_id", err)

    def test_refuses_when_gates_fired_not_list(self) -> None:
        bad = dict(VALID_RETRO, gates_fired="not a list")
        self.tmp = _make_repo(_phase(), retro=bad)
        code, _, err = _run_finish(self.tmp, "01-test")
        self.assertEqual(code, 2)
        self.assertIn("gates_fired", err)

    def test_refuses_when_gates_fired_item_missing_subkey(self) -> None:
        bad = dict(VALID_RETRO, gates_fired=[{"hook": "dangerous_cmd_guard", "deny_count": 1}])
        # Missing allow_count, examples
        self.tmp = _make_repo(_phase(), retro=bad)
        code, _, err = _run_finish(self.tmp, "01-test")
        self.assertEqual(code, 2)

    def test_refuses_when_line_count_exceeds_80(self) -> None:
        # Build a retro JSON whose pretty-printed form exceeds 80 lines.
        bloated = dict(VALID_RETRO, followups=[f"item {i}" for i in range(80)])
        self.tmp = _make_repo(_phase(), retro=bloated)
        code, _, err = _run_finish(self.tmp, "01-test")
        self.assertEqual(code, 2)
        self.assertIn("80", err)

    def test_refuses_when_retro_malformed_json(self) -> None:
        self.tmp = _make_repo(_phase(), retro=None)
        # Overwrite the retro path with garbage.
        (self.tmp / "phases/01-test.retro.json").write_text("{not json")
        code, _, err = _run_finish(self.tmp, "01-test")
        self.assertEqual(code, 2)
        self.assertIn("json", err.lower())

    def test_passes_with_valid_retro_and_no_gates(self) -> None:
        self.tmp = _make_repo(_phase(gates=[]), retro=VALID_RETRO)
        code, out, err = _run_finish(self.tmp, "01-test")
        self.assertEqual(code, 0, f"stderr: {err}")
        # Phase JSON should now have status=completed.
        saved = json.loads((self.tmp / "phases/01-test.json").read_text())
        self.assertEqual(saved["status"], "completed")

    def test_collects_all_errors_at_once(self) -> None:
        bad = {
            "phase_id": "wrong-id",
            "duration_min": 10,
            # missing gates_fired, git_diff_summary, tests_added, tests_passing_total
        }
        self.tmp = _make_repo(_phase("01-test"), retro=bad)
        code, _, err = _run_finish(self.tmp, "01-test")
        self.assertEqual(code, 2)
        # All four missing keys + the phase_id mismatch should be reported.
        self.assertIn("phase_id", err)
        self.assertIn("gates_fired", err)
        self.assertIn("git_diff_summary", err)
        self.assertIn("tests_added", err)
        self.assertIn("tests_passing_total", err)


if __name__ == "__main__":
    unittest.main()
