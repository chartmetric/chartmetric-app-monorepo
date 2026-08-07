"""Unittest suite for segment-aware glob matching (harness.globs)."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from harness.globs import path_match  # noqa: E402


class TestPathMatch(unittest.TestCase):
    def test_star_stays_within_segment(self) -> None:
        self.assertTrue(path_match("src/app.py", "src/*.py"))
        # The fnmatch bug this module exists to fix:
        self.assertFalse(path_match("src/deep/nested/evil.py", "src/*.py"))

    def test_doublestar_crosses_segments(self) -> None:
        self.assertTrue(path_match("src/deep/nested/evil.py", "src/**"))
        self.assertTrue(path_match("src/app.py", "src/**"))
        self.assertFalse(path_match("lib/app.py", "src/**"))

    def test_leading_doublestar_dir(self) -> None:
        self.assertTrue(path_match("a/b/c/x.test.ts", "**/*.test.ts"))
        self.assertTrue(path_match("x.test.ts", "**/*.test.ts"))
        self.assertFalse(path_match("a/b/x.spec.ts", "**/*.test.ts"))

    def test_monorepo_package_glob(self) -> None:
        self.assertTrue(path_match("packages/shared/src/config.ts", "packages/*/src/**"))
        # One `*` = exactly one segment:
        self.assertFalse(path_match("packages/a/b/src/x.ts", "packages/*/src/**"))
        self.assertFalse(path_match("packages/shared/lib/x.ts", "packages/*/src/**"))

    def test_exact_path(self) -> None:
        self.assertTrue(path_match("package.json", "package.json"))
        self.assertFalse(path_match("sub/package.json", "package.json"))

    def test_question_mark(self) -> None:
        self.assertTrue(path_match("src/a.py", "src/?.py"))
        self.assertFalse(path_match("src/ab.py", "src/?.py"))
        self.assertFalse(path_match("src/x/y.py", "src/?.py"))


if __name__ == "__main__":
    unittest.main()
