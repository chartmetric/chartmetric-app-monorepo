"""Unittest suite for execute.py finish smoke enforcement.

Phase JSON gains an optional `smoke_cmd` field. When present, `finish`
must run it as the last step before flipping status: completed. An
escape hatch (`HARNESS_SKIP_SMOKE=<reason>`) is honored only when the retro
documents the skip via a `smoke skipped:` followup entry.

Tests spawn execute.py as a subprocess against a throwaway repo. The
smoke command is a shell stub (`true` / `false` / sentinel-emitter)
so no real infra is required.

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


def _make_repo(phase: dict, retro: dict | None) -> Path:
    tmp = Path(tempfile.mkdtemp(prefix="harness-smoke-"))
    (tmp / "phases").mkdir()
    (tmp / "phases" / f"{phase['id']}.json").write_text(json.dumps(phase, indent=2))
    if retro is not None:
        (tmp / "phases" / f"{phase['id']}.retro.json").write_text(json.dumps(retro, indent=2))
    shutil.copytree(SCRIPTS_DIR, tmp / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
    (tmp / "docs").mkdir()
    (tmp / "docs/PRD.md").write_text("# PRD\n\nproblem statement line 1\nline 2\nline 3\n")
    (tmp / "docs/ARCHITECTURE.md").write_text("# Arch\n\narch line 1\nline 2\nline 3\n")
    return tmp


def _phase(
    id_: str = "01-test",
    gates: list[str] | None = None,
    smoke_cmd: str | None = None,
) -> dict:
    p = {
        "id": id_,
        "title": "Test phase",
        "status": "in_progress",
        "depends_on": [],
        "acceptance": [],
        "files": [],
        "gates": gates or [],
        "notes": "",
    }
    if smoke_cmd is not None:
        p["smoke_cmd"] = smoke_cmd
    return p


def _run_finish(
    cwd: Path,
    phase_id: str,
    extra_env: dict | None = None,
) -> subprocess.CompletedProcess:
    env = {**os.environ, "CLAUDE_PROJECT_DIR": str(cwd)}
    if extra_env:
        env.update(extra_env)
    return subprocess.run(
        [sys.executable, str(cwd / "scripts/execute.py"), "finish", phase_id],
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=15,
        env=env,
    )


def _read_audit(tmp: Path) -> list[dict]:
    path = tmp / ".harness/audit.jsonl"
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


class TestFinishSmoke(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp: Path | None = None

    def tearDown(self) -> None:
        if self.tmp is not None:
            shutil.rmtree(self.tmp, ignore_errors=True)

    def test_smoke_absent_finish_completes(self) -> None:
        # Back-compat with current phases 01, 07–13: no smoke_cmd → finish OK.
        self.tmp = _make_repo(_phase(smoke_cmd=None), retro=VALID_RETRO)
        result = _run_finish(self.tmp, "01-test")
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        saved = json.loads((self.tmp / "phases/01-test.json").read_text())
        self.assertEqual(saved["status"], "completed")
        events = _read_audit(self.tmp)
        kinds = [e.get("event") for e in events]
        self.assertNotIn("smoke_passed", kinds)
        self.assertNotIn("smoke_skipped", kinds)

    def test_smoke_passes_finish_completes_and_logs(self) -> None:
        self.tmp = _make_repo(_phase(smoke_cmd="true"), retro=VALID_RETRO)
        result = _run_finish(self.tmp, "01-test")
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        saved = json.loads((self.tmp / "phases/01-test.json").read_text())
        self.assertEqual(saved["status"], "completed")
        events = _read_audit(self.tmp)
        passed = [e for e in events if e.get("event") == "smoke_passed"]
        self.assertEqual(len(passed), 1)
        self.assertEqual(passed[0]["phase_id"], "01-test")
        self.assertEqual(passed[0]["smoke_cmd"], "true")

    def test_smoke_fails_finish_refuses_status_unchanged(self) -> None:
        smoke = (
            'sh -c \'for i in $(seq 1 100); do echo "smoke-line-$i"; done; '
            'echo "SMOKE-FAIL-SENTINEL" 1>&2; exit 1\''
        )
        self.tmp = _make_repo(_phase(smoke_cmd=smoke), retro=VALID_RETRO)
        result = _run_finish(self.tmp, "01-test")
        self.assertNotEqual(result.returncode, 0)
        saved = json.loads((self.tmp / "phases/01-test.json").read_text())
        # Phase did NOT advance to completed.
        self.assertEqual(saved["status"], "in_progress")
        # Output appears in stderr (sentinel from stderr; tail content).
        combined = result.stdout + result.stderr
        self.assertIn("smoke failed", result.stderr)
        self.assertIn("SMOKE-FAIL-SENTINEL", combined)
        self.assertIn("smoke-line-100", combined)
        # No smoke_passed event emitted.
        events = _read_audit(self.tmp)
        kinds = [e.get("event") for e in events]
        self.assertNotIn("smoke_passed", kinds)

    def test_skip_with_documented_followup_completes(self) -> None:
        retro = dict(VALID_RETRO, followups=["smoke skipped: no docker on CI runner"])
        self.tmp = _make_repo(_phase(smoke_cmd="false"), retro=retro)
        result = _run_finish(
            self.tmp,
            "01-test",
            extra_env={"HARNESS_SKIP_SMOKE": "no docker on CI runner"},
        )
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        saved = json.loads((self.tmp / "phases/01-test.json").read_text())
        self.assertEqual(saved["status"], "completed")
        events = _read_audit(self.tmp)
        skipped = [e for e in events if e.get("event") == "smoke_skipped"]
        self.assertEqual(len(skipped), 1)
        self.assertEqual(skipped[0]["reason"], "no docker on CI runner")
        self.assertEqual(skipped[0]["smoke_cmd"], "false")

    def test_skip_without_followup_refuses(self) -> None:
        # retro has no smoke-skipped entry → finish refuses.
        retro = dict(VALID_RETRO, followups=["P2: unrelated cleanup"])
        self.tmp = _make_repo(_phase(smoke_cmd="true"), retro=retro)
        result = _run_finish(
            self.tmp,
            "01-test",
            extra_env={"HARNESS_SKIP_SMOKE": "infra unavailable"},
        )
        self.assertEqual(result.returncode, 2)
        self.assertIn("smoke skipped:", result.stderr.lower())
        saved = json.loads((self.tmp / "phases/01-test.json").read_text())
        self.assertEqual(saved["status"], "in_progress")
        events = _read_audit(self.tmp)
        kinds = [e.get("event") for e in events]
        self.assertNotIn("smoke_skipped", kinds)
        self.assertNotIn("smoke_passed", kinds)


if __name__ == "__main__":
    unittest.main()
