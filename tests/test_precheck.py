"""Unittest suite for execute.py precheck.

Builds throwaway repos with various doc states and asserts on
precheck's exit code (0 = pass, 2 = blocked).

After Item 3, precheck also requires AGENTS.md sections 2, 3, 4 each
to have ≥ 3 substantive lines.

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

SKELETON_DOC = "# PRD\n\n## 1. Problem\n<!-- fill later -->\n\n## 2. Users\n<!-- fill later -->\n"
FILLED_DOC = (
    "# PRD\n\n## 1. Problem\n\n"
    "We need a billing service that ingests usage events from caller\n"
    "services and stores them durably for downstream invoicing.\n\n"
    "Events include Flow chat queries, MCP requests, Data Assistant\n"
    "lookups, REST API hits, and CSV exports.\n\n"
    "The service exposes a balance-check API for prepaid gatekeeping.\n"
)

# A fully-filled AGENTS.md with substantive content in §2, §3, §4.
FILLED_AGENTS = (
    "# AGENTS.md\n\n"
    "## 1. Project context\n"
    "- PRD — docs/PRD.md\n\n"
    "## 2. How we write code\n"
    "TypeScript strict mode everywhere.\n"
    "No `any` without a comment explaining why.\n"
    "Tests accompany any logic under packages/*/src/.\n\n"
    "## 3. Git & PR workflow\n"
    "One phase per PR. Squash on merge.\n"
    "Conventional commits required.\n"
    "Branch from main; rebase, don't merge.\n\n"
    "## 4. Hooks (auto-enforced)\n"
    "dangerous_cmd_guard blocks rm -rf at root and similar.\n"
    "Denied commands are never retried with --no-verify.\n"
    "Deny events are written to .harness/audit.jsonl.\n"
)


def _precheck(cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(cwd / "scripts/execute.py"), "precheck"],
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=10,
    )


def _run_precheck(cwd: Path) -> int:
    return _precheck(cwd).returncode


def _make_repo(
    prd: str | None = FILLED_DOC,
    arch: str | None = FILLED_DOC,
    agents: str | None = FILLED_AGENTS,
    config: dict | None = None,
) -> Path:
    tmp = Path(tempfile.mkdtemp(prefix="harness-precheck-"))
    (tmp / "docs").mkdir()
    if prd is not None:
        (tmp / "docs/PRD.md").write_text(prd)
    if arch is not None:
        (tmp / "docs/ARCHITECTURE.md").write_text(arch)
    if agents is not None:
        (tmp / "AGENTS.md").write_text(agents)
    if config is not None:
        (tmp / "harness.config.json").write_text(json.dumps(config))
    shutil.copytree(SCRIPTS_DIR, tmp / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
    return tmp


class TestPrecheck(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp: Path | None = None

    def tearDown(self) -> None:
        if self.tmp is not None:
            shutil.rmtree(self.tmp, ignore_errors=True)

    # Existing PRD / ARCHITECTURE coverage.

    def test_both_skeleton_blocks(self) -> None:
        self.tmp = _make_repo(SKELETON_DOC, SKELETON_DOC)
        self.assertEqual(_run_precheck(self.tmp), 2)

    def test_only_prd_filled_blocks(self) -> None:
        self.tmp = _make_repo(FILLED_DOC, SKELETON_DOC)
        self.assertEqual(_run_precheck(self.tmp), 2)

    def test_only_arch_filled_blocks(self) -> None:
        self.tmp = _make_repo(SKELETON_DOC, FILLED_DOC)
        self.assertEqual(_run_precheck(self.tmp), 2)

    def test_all_filled_passes(self) -> None:
        self.tmp = _make_repo(FILLED_DOC, FILLED_DOC, FILLED_AGENTS)
        self.assertEqual(_run_precheck(self.tmp), 0)

    def test_missing_prd_file_blocks(self) -> None:
        self.tmp = _make_repo(prd=None)
        self.assertEqual(_run_precheck(self.tmp), 2)

    def test_comment_only_prd_blocks(self) -> None:
        self.tmp = _make_repo("# PRD\n\n<!-- this is the entire content -->\n")
        self.assertEqual(_run_precheck(self.tmp), 2)

    # New AGENTS.md coverage (Item 3).

    def test_agents_missing_blocks(self) -> None:
        self.tmp = _make_repo(agents=None)
        code = _run_precheck(self.tmp)
        self.assertEqual(code, 2)

    def test_agents_section_2_empty_blocks(self) -> None:
        agents = (
            "# AGENTS.md\n\n"
            "## 1. Project context\n- PRD\n\n"
            "## 2. How we write code\n"
            "<!-- fill later -->\n\n"
            "## 3. Git & PR workflow\nline 1\nline 2\nline 3\n\n"
            "## 4. Hooks\nline 1\nline 2\nline 3\n"
        )
        self.tmp = _make_repo(agents=agents)
        code = _run_precheck(self.tmp)
        self.assertEqual(code, 2)

    def test_agents_section_3_comment_only_blocks(self) -> None:
        agents = (
            "# AGENTS.md\n\n"
            "## 2. How we write code\nline 1\nline 2\nline 3\n\n"
            "## 3. Git & PR workflow\n"
            "<!-- todo -->\n"
            "<!--\nmulti-line\ncomment\n-->\n\n"
            "## 4. Hooks\nline 1\nline 2\nline 3\n"
        )
        self.tmp = _make_repo(agents=agents)
        code = _run_precheck(self.tmp)
        self.assertEqual(code, 2)

    def test_agents_section_4_missing_blocks(self) -> None:
        agents = (
            "# AGENTS.md\n\n"
            "## 2. How we write code\nline 1\nline 2\nline 3\n\n"
            "## 3. Git & PR workflow\nline 1\nline 2\nline 3\n"
            # No section 4 at all.
        )
        self.tmp = _make_repo(agents=agents)
        code = _run_precheck(self.tmp)
        self.assertEqual(code, 2)

    def test_agents_section_with_exactly_3_lines_passes(self) -> None:
        agents = (
            "# AGENTS.md\n\n"
            "## 2. How we write code\nline 1\nline 2\nline 3\n\n"
            "## 3. Git & PR workflow\nline 1\nline 2\nline 3\n\n"
            "## 4. Hooks\nline 1\nline 2\nline 3\n"
        )
        self.tmp = _make_repo(agents=agents)
        code = _run_precheck(self.tmp)
        self.assertEqual(code, 0)


class TestAdvisoryDocs(unittest.TestCase):
    """`advisory_docs` reports without blocking — the gap that let a green
    precheck be followed by a later stage refusing for an unmentioned doc."""

    ADVISORY_CONFIG = {
        "required_docs": ["docs/ARCHITECTURE.md"],
        "advisory_docs": {"docs/PRD.md": "run /feature-intake"},
        "agents_sections": [],
    }

    def setUp(self) -> None:
        self.tmp: Path | None = None

    def tearDown(self) -> None:
        if self.tmp is not None:
            shutil.rmtree(self.tmp, ignore_errors=True)

    def test_missing_advisory_doc_passes_but_reports(self) -> None:
        self.tmp = _make_repo(prd=None, config=self.ADVISORY_CONFIG)
        proc = _precheck(self.tmp)
        self.assertEqual(proc.returncode, 0)
        self.assertIn("docs/PRD.md", proc.stdout)
        self.assertIn("run /feature-intake", proc.stdout)

    def test_skeleton_advisory_doc_passes_but_reports(self) -> None:
        self.tmp = _make_repo(prd=SKELETON_DOC, config=self.ADVISORY_CONFIG)
        proc = _precheck(self.tmp)
        self.assertEqual(proc.returncode, 0)
        self.assertIn("docs/PRD.md", proc.stdout)

    def test_filled_advisory_doc_is_silent(self) -> None:
        self.tmp = _make_repo(prd=FILLED_DOC, config=self.ADVISORY_CONFIG)
        proc = _precheck(self.tmp)
        self.assertEqual(proc.returncode, 0)
        self.assertNotIn("advisories", proc.stdout)

    def test_advisory_does_not_mask_a_required_failure(self) -> None:
        self.tmp = _make_repo(prd=None, arch=SKELETON_DOC, config=self.ADVISORY_CONFIG)
        proc = _precheck(self.tmp)
        self.assertEqual(proc.returncode, 2)
        self.assertIn("docs/ARCHITECTURE.md", proc.stderr)
        self.assertIn("docs/PRD.md", proc.stdout)

    def test_no_advisory_docs_configured_is_silent(self) -> None:
        config = {"required_docs": ["docs/ARCHITECTURE.md"], "agents_sections": []}
        self.tmp = _make_repo(prd=None, config=config)
        proc = _precheck(self.tmp)
        self.assertEqual(proc.returncode, 0)
        self.assertNotIn("advisories", proc.stdout)


if __name__ == "__main__":
    unittest.main()
