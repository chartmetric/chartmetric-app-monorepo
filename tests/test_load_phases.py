"""Unittest suite for execute.py phase enumeration.

load_phases() must skip the retro template and per-phase retro files.
Without that filter, `status` (and any other consumer) crashes on
KeyError: 'status' when a non-phase JSON sits in phases/.

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


def _make_repo() -> Path:
    tmp = Path(tempfile.mkdtemp(prefix="harness-loadphases-"))
    shutil.copytree(SCRIPTS_DIR, tmp / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
    (tmp / "phases").mkdir()
    return tmp


def _run_status(cwd: Path) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(cwd / "scripts/execute.py"), "status"],
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=10,
    )


class TestLoadPhases(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp: Path | None = None

    def tearDown(self) -> None:
        if self.tmp is not None:
            shutil.rmtree(self.tmp, ignore_errors=True)

    def test_status_with_only_template_reports_empty(self) -> None:
        self.tmp = _make_repo()
        (self.tmp / "phases/RETRO_TEMPLATE.json").write_text(
            json.dumps({"phase_id": "NN-slug", "duration_min": 0}) + "\n"
        )
        proc = _run_status(self.tmp)
        self.assertEqual(proc.returncode, 0, msg=proc.stderr)
        self.assertIn("No phases defined yet", proc.stdout)

    def test_status_skips_retro_files(self) -> None:
        self.tmp = _make_repo()
        (self.tmp / "phases/01-foo.json").write_text(
            json.dumps(
                {
                    "id": "01-foo",
                    "title": "Foo phase",
                    "status": "pending",
                    "depends_on": [],
                    "acceptance": [],
                    "files": [],
                    "gates": [],
                    "notes": "",
                }
            )
            + "\n"
        )
        (self.tmp / "phases/01-foo.retro.json").write_text(
            json.dumps({"phase_id": "01-foo", "duration_min": 5}) + "\n"
        )
        (self.tmp / "phases/RETRO_TEMPLATE.json").write_text(
            json.dumps({"phase_id": "NN-slug", "duration_min": 0}) + "\n"
        )
        proc = _run_status(self.tmp)
        self.assertEqual(proc.returncode, 0, msg=proc.stderr)
        self.assertIn("01-foo", proc.stdout)
        self.assertIn("Foo phase", proc.stdout)
        self.assertNotIn("RETRO_TEMPLATE", proc.stdout)


if __name__ == "__main__":
    unittest.main()
