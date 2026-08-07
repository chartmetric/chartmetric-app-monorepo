"""Unittest suite for `execute.py doctor` — first-run environment check."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_SRC = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = REPO_SRC / "scripts"


def _make_repo(git: bool = True) -> Path:
    tmp = Path(tempfile.mkdtemp(prefix="harness-doctor-"))
    shutil.copytree(SCRIPTS_DIR, tmp / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
    (tmp / "phases").mkdir()
    (tmp / "phases/PHASE_TEMPLATE.md").write_text("# t\n")
    (tmp / "phases/RETRO_TEMPLATE.json").write_text("{}")
    (tmp / "docs").mkdir()
    (tmp / ".agents").mkdir()
    shutil.copy(REPO_SRC / ".agents/settings.json", tmp / ".agents/settings.json")
    (tmp / ".claude").symlink_to(".agents")
    (tmp / "AGENTS.md").write_text("# AGENTS\n")
    (tmp / "CLAUDE.md").symlink_to("AGENTS.md")
    if git:
        subprocess.run(["git", "init", "-q"], cwd=tmp, check=True)
    return tmp


def _doctor(tmp: Path, extra_env: dict | None = None) -> subprocess.CompletedProcess:
    env = {**os.environ, "CLAUDE_PROJECT_DIR": str(tmp)}
    env.pop("HARNESS_CLAUDE_CMD", None)
    if extra_env:
        env.update(extra_env)
    return subprocess.run(
        [sys.executable, str(tmp / "scripts/execute.py"), "doctor"],
        cwd=tmp,
        capture_output=True,
        text=True,
        timeout=30,
        env=env,
    )


class TestDoctor(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = _make_repo()

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_healthy_repo_passes(self) -> None:
        # Point the agent command at something guaranteed on PATH so
        # the check is deterministic regardless of claude being installed.
        result = _doctor(self.tmp, extra_env={"HARNESS_CLAUDE_CMD": sys.executable})
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertIn("doctor: ok", result.stdout)
        self.assertIn("hook wired: dangerous_cmd_guard.py", result.stdout)

    def test_missing_agent_symlinks_fail(self) -> None:
        (self.tmp / "CLAUDE.md").unlink()
        result = _doctor(self.tmp, extra_env={"HARNESS_CLAUDE_CMD": sys.executable})
        self.assertEqual(result.returncode, 1)
        self.assertIn("CLAUDE.md missing", result.stdout)

    def test_broken_agent_symlink_reported_as_broken(self) -> None:
        (self.tmp / "AGENTS.md").unlink()
        result = _doctor(self.tmp, extra_env={"HARNESS_CLAUDE_CMD": sys.executable})
        self.assertEqual(result.returncode, 1)
        self.assertIn("CLAUDE.md is a broken symlink", result.stdout)

    def test_skeleton_docs_reported_as_info_not_failure(self) -> None:
        result = _doctor(self.tmp, extra_env={"HARNESS_CLAUDE_CMD": sys.executable})
        self.assertEqual(result.returncode, 0)
        self.assertIn("still skeletons", result.stdout)

    def test_broken_config_fails(self) -> None:
        (self.tmp / "harness.config.json").write_text('{"max_attempts": "five"}')
        result = _doctor(self.tmp, extra_env={"HARNESS_CLAUDE_CMD": sys.executable})
        self.assertEqual(result.returncode, 1)
        self.assertIn("harness.config.json is broken", result.stdout)

    def test_not_a_git_repo_fails(self) -> None:
        tmp = _make_repo(git=False)
        try:
            result = _doctor(tmp, extra_env={"HARNESS_CLAUDE_CMD": sys.executable})
            self.assertEqual(result.returncode, 1)
            self.assertIn("not a git repository", result.stdout)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_missing_agent_binary_warns_not_fails(self) -> None:
        result = _doctor(
            self.tmp, extra_env={"HARNESS_CLAUDE_CMD": "definitely-not-a-real-binary-xyz"}
        )
        self.assertEqual(result.returncode, 0)
        self.assertIn("not on PATH", result.stdout)

    def test_unwired_hook_warns(self) -> None:
        (self.tmp / ".claude/settings.json").write_text(json.dumps({"hooks": {}}))
        result = _doctor(self.tmp, extra_env={"HARNESS_CLAUDE_CMD": sys.executable})
        self.assertEqual(result.returncode, 0)
        self.assertIn("not referenced in .agents/settings.json", result.stdout)


if __name__ == "__main__":
    unittest.main()
