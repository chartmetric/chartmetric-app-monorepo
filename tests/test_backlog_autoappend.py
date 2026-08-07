"""Unittest suite for scripts/_backlog.append_exhausted_item.

The function is called from the retry-loop exhaustion path
(Piece 3 + Piece 1). Tests cover insertion, dedup, missing section,
and missing file scenarios in isolation — no subprocess invocation.

Run:
    python3 -m unittest discover tests -v
"""

from __future__ import annotations

import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from _backlog import append_exhausted_item  # noqa: E402

BACKLOG_SEED = (
    "# Backlog\n\n"
    "Backlog — non-blocking followups.\n\n"
    "## Active\n\n"
    "- [ ] [P2] Some prior item. Source: foo, 2026-05-01.\n"
    "- [ ] [P3] Another item. Source: bar, 2026-05-02.\n\n"
    "## Resolved\n\n"
    "(empty)\n"
)


class TestAppendExhaustedItem(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="harness-backlog-"))
        self.path = self.tmp / "BACKLOG.md"

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_inserts_after_active_heading(self) -> None:
        self.path.write_text(BACKLOG_SEED)
        err = append_exhausted_item(
            self.path,
            phase_id="01-foundation",
            max_attempts=5,
            verification_cmd="python3 -m unittest discover tests -v",
            last_error_summary="AssertionError: 0 != 2",
        )
        self.assertIsNone(err)
        content = self.path.read_text()
        # New item lands between "## Active" and the existing first item.
        active_idx = content.find("## Active")
        prior_idx = content.find("[P2] Some prior item")
        new_idx = content.find("Phase 01-foundation retry exhausted")
        self.assertTrue(active_idx < new_idx < prior_idx)
        # Format check — full inserted item.
        self.assertIn(
            "- [ ] [P1] Phase 01-foundation retry exhausted after 5 attempts",
            content,
        )
        self.assertIn("harness_loop", content)

    def test_empty_active_section_works(self) -> None:
        self.path.write_text("# Backlog\n\n## Active\n\n## Resolved\n")
        err = append_exhausted_item(
            self.path,
            "02-foo",
            5,
            "true",
            "boom",
        )
        self.assertIsNone(err)
        self.assertIn("Phase 02-foo retry exhausted", self.path.read_text())

    def test_duplicate_phase_id_skipped(self) -> None:
        self.path.write_text(BACKLOG_SEED)
        append_exhausted_item(self.path, "01-foo", 5, "true", "err1")
        append_exhausted_item(self.path, "01-foo", 5, "true", "err2")
        content = self.path.read_text()
        # Only one item for this phase_id.
        self.assertEqual(content.count("Phase 01-foo retry exhausted"), 1)

    def test_distinct_labels_do_not_dedup_each_other(self) -> None:
        self.path.write_text(BACKLOG_SEED)
        common = {
            "phase_id": "01-foundation",
            "max_attempts": 2,
            "verification_cmd": "x",
            "last_error_summary": "err",
        }
        self.assertIsNone(append_exhausted_item(self.path, **common))
        self.assertIsNone(
            append_exhausted_item(self.path, **common, label="review cycles exhausted")
        )
        content = self.path.read_text()
        self.assertIn("Phase 01-foundation retry exhausted", content)
        self.assertIn("Phase 01-foundation review cycles exhausted", content)

    def test_missing_active_section_returns_error(self) -> None:
        self.path.write_text("# Backlog\n\nNo Active section here.\n")
        err = append_exhausted_item(self.path, "03-bar", 5, "true", "x")
        self.assertIsNotNone(err)
        assert err is not None
        self.assertIn("Active", err)
        # File must NOT be corrupted.
        self.assertEqual(self.path.read_text(), "# Backlog\n\nNo Active section here.\n")

    def test_missing_file_returns_error(self) -> None:
        # path does not exist
        err = append_exhausted_item(self.path, "04-x", 5, "true", "x")
        self.assertIsNotNone(err)


if __name__ == "__main__":
    unittest.main()
