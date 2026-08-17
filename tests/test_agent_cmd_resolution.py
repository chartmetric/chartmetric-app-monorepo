"""Unittest suite for resolve_agent_cmd's default-command fallback."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from harness import agents


class TestDefaultAgentCmd(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="harness-agents-"))
        patcher_env = mock.patch.dict(os.environ, clear=False)
        patcher_env.start()
        self.addCleanup(patcher_env.stop)
        for var in ("HARNESS_CLAUDE_CMD", "HARNESS_WRITER_CMD"):
            os.environ.pop(var, None)
        patcher_root = mock.patch.object(agents, "REPO_ROOT", self.tmp)
        patcher_root.start()
        self.addCleanup(patcher_root.stop)
        patcher_config = mock.patch.object(agents, "get_config", return_value={})
        patcher_config.start()
        self.addCleanup(patcher_config.stop)

    def test_default_prefers_workspace_binary(self):
        bin_dir = self.tmp / "node_modules" / ".bin"
        bin_dir.mkdir(parents=True)
        (bin_dir / "claude").touch()

        argv = agents.resolve_agent_cmd("writer")

        self.assertEqual(argv[0], str(bin_dir / "claude"))
        self.assertEqual(argv[1:], ["--permission-mode", "auto", "--model", "opus"])

    def test_default_falls_back_to_path_lookup(self):
        argv = agents.resolve_agent_cmd("writer")

        self.assertEqual(argv[0], "claude")

    def test_env_override_ignores_workspace_binary(self):
        bin_dir = self.tmp / "node_modules" / ".bin"
        bin_dir.mkdir(parents=True)
        (bin_dir / "claude").touch()
        os.environ["HARNESS_CLAUDE_CMD"] = "/usr/bin/stub --flag"

        argv = agents.resolve_agent_cmd("writer")

        self.assertEqual(argv, ["/usr/bin/stub", "--flag"])


if __name__ == "__main__":
    unittest.main()
