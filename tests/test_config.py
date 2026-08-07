"""Unittest suite for scripts/_config.load_config."""

from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import _config  # noqa: E402


class TestLoadConfig(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="harness-config-"))
        _config.clear_cache()

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)
        _config.clear_cache()

    def test_defaults_when_no_file(self) -> None:
        config = _config.load_config(self.tmp)
        self.assertEqual(config["max_attempts"], 5)
        self.assertEqual(config["max_review_cycles"], 2)
        self.assertIn("*.test.*", config["test_file_conventions"])
        self.assertEqual(config["agent_cmds"], {})

    def test_file_overrides_merge_with_defaults(self) -> None:
        (self.tmp / _config.CONFIG_FILE_NAME).write_text(
            json.dumps({"max_attempts": 3, "project_name": "acme"})
        )
        config = _config.load_config(self.tmp)
        self.assertEqual(config["max_attempts"], 3)
        self.assertEqual(config["project_name"], "acme")
        # Untouched keys keep defaults.
        self.assertEqual(config["max_review_cycles"], 2)

    def test_unknown_keys_preserved(self) -> None:
        (self.tmp / _config.CONFIG_FILE_NAME).write_text(json.dumps({"custom_knob": 42}))
        self.assertEqual(_config.load_config(self.tmp)["custom_knob"], 42)

    def test_malformed_file_raises(self) -> None:
        (self.tmp / _config.CONFIG_FILE_NAME).write_text("{not json")
        with self.assertRaises(json.JSONDecodeError):
            _config.load_config(self.tmp)

    def test_wrong_type_for_known_key_raises(self) -> None:
        (self.tmp / _config.CONFIG_FILE_NAME).write_text(json.dumps({"max_attempts": "5"}))
        with self.assertRaises(ValueError) as ctx:
            _config.load_config(self.tmp)
        self.assertIn("max_attempts", str(ctx.exception))

    def test_bool_is_not_a_valid_int(self) -> None:
        (self.tmp / _config.CONFIG_FILE_NAME).write_text(json.dumps({"max_attempts": True}))
        with self.assertRaises(ValueError):
            _config.load_config(self.tmp)

    def test_timeout_defaults_present(self) -> None:
        config = _config.load_config(self.tmp)
        self.assertEqual(config["agent_timeout_sec"], 3600)
        self.assertEqual(config["command_timeout_sec"], 1800)

    def test_cache_is_per_root(self) -> None:
        other = Path(tempfile.mkdtemp(prefix="harness-config2-"))
        try:
            (other / _config.CONFIG_FILE_NAME).write_text(json.dumps({"max_attempts": 9}))
            self.assertEqual(_config.load_config(self.tmp)["max_attempts"], 5)
            self.assertEqual(_config.load_config(other)["max_attempts"], 9)
        finally:
            shutil.rmtree(other, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
