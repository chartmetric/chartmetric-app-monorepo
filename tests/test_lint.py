"""Unittest suite for `execute.py lint` — the pre-flight stage.

Covers the two historical footguns it exists for: a typo'd file path in
verification_cmd (burned a full retry budget once) and JSON<->MD
acceptance drift, plus schema/type validation.
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


def _make_repo() -> Path:
    tmp = Path(tempfile.mkdtemp(prefix="harness-lint-"))
    shutil.copytree(SCRIPTS_DIR, tmp / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
    (tmp / "phases").mkdir()
    (tmp / "docs").mkdir()
    return tmp


def _write_phase(tmp: Path, phase: dict, md: str | None) -> None:
    (tmp / "phases" / f"{phase['id']}.json").write_text(json.dumps(phase, indent=2))
    if md is not None:
        (tmp / "phases" / f"{phase['id']}.md").write_text(md)


def _lint(tmp: Path, phase_id: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(tmp / "scripts/execute.py"), "lint", phase_id],
        cwd=tmp,
        capture_output=True,
        text=True,
        timeout=30,
        env={**os.environ, "CLAUDE_PROJECT_DIR": str(tmp)},
    )


GOOD_MD = "# Phase\n\n## Goal\n\nBuild foo.\n\n## Acceptance\n\n- foo exists\n- bar exists\n"


def _good_phase() -> dict:
    return {
        "id": "01-foo",
        "title": "Foo",
        "status": "pending",
        "acceptance": ["foo exists", "bar exists"],
        "verification_cmd": "true",
    }


class TestLint(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = _make_repo()

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_clean_phase_passes(self) -> None:
        _write_phase(self.tmp, _good_phase(), GOOD_MD)
        result = _lint(self.tmp, "01-foo")
        self.assertEqual(result.returncode, 0, msg=result.stderr)

    def test_missing_md_fails(self) -> None:
        _write_phase(self.tmp, _good_phase(), None)
        result = _lint(self.tmp, "01-foo")
        self.assertEqual(result.returncode, 2)
        self.assertIn("phase spec missing", result.stderr)

    def test_acceptance_drift_fails(self) -> None:
        phase = _good_phase()
        phase["acceptance"] = ["foo exists", "bar exists", "baz exists"]
        _write_phase(self.tmp, phase, GOOD_MD)
        result = _lint(self.tmp, "01-foo")
        self.assertEqual(result.returncode, 2)
        self.assertIn("acceptance drift", result.stderr)
        self.assertIn("3 criteria", result.stderr)
        self.assertIn("2 bullets", result.stderr)

    def test_missing_acceptance_heading_fails(self) -> None:
        _write_phase(self.tmp, _good_phase(), "# Phase\n\nDo the thing.\n")
        result = _lint(self.tmp, "01-foo")
        self.assertEqual(result.returncode, 2)
        self.assertIn("no `## Acceptance` heading", result.stderr)

    def test_nested_sub_bullets_not_counted(self) -> None:
        md = (
            "# Phase\n\n## Acceptance\n\n"
            "- foo exists\n"
            "  - detail: with retries\n"
            "  - detail: idempotent\n"
            "- bar exists\n"
        )
        _write_phase(self.tmp, _good_phase(), md)
        result = _lint(self.tmp, "01-foo")
        self.assertEqual(result.returncode, 0, msg=result.stderr)

    def test_verifier_test_path_violating_convention_fails(self) -> None:
        # The Phase-04 bug class: vitest only picks up *.test.ts, the
        # verifier said flow_smoke.ts — silent fail, budget burned.
        phase = _good_phase()
        phase["verification_cmd"] = "test -f tests/integration/flow_smoke.ts"
        md = GOOD_MD + "\nWrites tests/integration/flow_smoke.ts as smoke.\n"
        _write_phase(self.tmp, phase, md)
        result = _lint(self.tmp, "01-foo")
        self.assertEqual(result.returncode, 2)
        self.assertIn("matches no configured test filename convention", result.stderr)

    def test_verifier_path_unknown_to_spec_fails(self) -> None:
        phase = _good_phase()
        phase["verification_cmd"] = "test -f src/widgets/frobnicator.ts"
        _write_phase(self.tmp, phase, GOOD_MD)
        result = _lint(self.tmp, "01-foo")
        self.assertEqual(result.returncode, 2)
        self.assertIn("not mentioned in the spec", result.stderr)

    def test_verifier_path_mentioned_in_md_passes(self) -> None:
        phase = _good_phase()
        phase["verification_cmd"] = "test -f src/widgets/frobnicator.ts"
        md = GOOD_MD + "\nCreate src/widgets/frobnicator.ts with the widget.\n"
        _write_phase(self.tmp, phase, md)
        result = _lint(self.tmp, "01-foo")
        self.assertEqual(result.returncode, 0, msg=result.stderr)

    def test_verifier_path_in_files_list_passes(self) -> None:
        phase = _good_phase()
        phase["verification_cmd"] = "test -f src/widgets/frobnicator.ts"
        phase["files"] = ["src/widgets/frobnicator.ts"]
        _write_phase(self.tmp, phase, GOOD_MD)
        result = _lint(self.tmp, "01-foo")
        self.assertEqual(result.returncode, 0, msg=result.stderr)

    def test_verifier_path_existing_on_disk_passes(self) -> None:
        (self.tmp / "src").mkdir()
        (self.tmp / "src/existing.py").write_text("x = 1\n")
        phase = _good_phase()
        phase["verification_cmd"] = "python3 src/existing.py"
        _write_phase(self.tmp, phase, GOOD_MD)
        result = _lint(self.tmp, "01-foo")
        self.assertEqual(result.returncode, 0, msg=result.stderr)

    def test_id_filename_mismatch_fails(self) -> None:
        phase = _good_phase()
        phase["id"] = "01-bar"
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase))
        (self.tmp / "phases/01-foo.md").write_text(GOOD_MD)
        # Also write the md the id points at so only the mismatch fires.
        (self.tmp / "phases/01-bar.md").write_text(GOOD_MD)
        result = _lint(self.tmp, "01-bar")
        self.assertEqual(result.returncode, 2)
        self.assertIn("does not match filename", result.stderr)

    def test_unknown_dependency_fails(self) -> None:
        phase = _good_phase()
        phase["depends_on"] = ["00-ghost"]
        _write_phase(self.tmp, phase, GOOD_MD)
        result = _lint(self.tmp, "01-foo")
        self.assertEqual(result.returncode, 2)
        self.assertIn("unknown phase: 00-ghost", result.stderr)

    def test_wrong_types_fail(self) -> None:
        phase = _good_phase()
        phase["gates"] = "pnpm test"
        _write_phase(self.tmp, phase, GOOD_MD)
        result = _lint(self.tmp, "01-foo")
        self.assertEqual(result.returncode, 2)
        self.assertIn("gates must be a list", result.stderr)


if __name__ == "__main__":
    unittest.main()
