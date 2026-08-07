"""Unittest suite for `execute.py run` — the one-shot pipeline.

lint -> write -> gates -> smoke -> review -> retro -> commit, with
stage persistence/resume, the blocking review loop, and the
agent-drafted retro.

All agent roles (writer / reviewer / fix / retro drafter) are served by
one stub whose behaviour is steered via STUB_* env vars. The stub
recognises its role from the prompt, mirroring how execute.py builds
role-specific prompts.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"

FILLED_DOC = "# Doc\n\nline one.\nline two.\nline three.\n"
FILLED_AGENTS = (
    "# AGENTS.md\n\n"
    "## 1. Project context\n- PRD\n\n"
    "## 2. How we write code\nline 1\nline 2\nline 3\n\n"
    "## 3. Git & PR workflow\nline 1\nline 2\nline 3\n\n"
    "## 4. Hooks\nline 1\nline 2\nline 3\n"
)
BACKLOG_SEED = "# Backlog\n\n## Active\n\n## Resolved\n"

AGENT_STUB = textwrap.dedent(
    '''\
    #!/usr/bin/env python3
    """Role-aware agent stub for pipeline tests."""
    import json, os, re, sys

    prompt = sys.argv[-1]
    state = os.environ["STUB_STATE_DIR"]

    def bump(name):
        path = os.path.join(state, name)
        n = int(open(path).read()) if os.path.exists(path) else 0
        n += 1
        open(path, "w").write(str(n))
        return n

    if prompt.startswith("Draft the post-phase retro"):
        n = bump("retro_calls")
        mode = os.environ.get("STUB_RETRO", "valid")
        if mode == "garbage":
            print("I cannot produce JSON today, sorry.")
            sys.exit(0)
        phase_id = re.search(r'"phase_id": "([^"]+)"', prompt).group(1)
        retro = {
            "phase_id": phase_id,
            "duration_min": 1,
            "gates_fired": [],
            "git_diff_summary": "1 file changed",
            "tests_added": 1,
            "tests_passing_total": 1,
            "drafted_by": "agent",
            "surprises": ["stub surprise"],
            "proposed_rules": [],
            "followups": [],
        }
        print(json.dumps(retro))
    elif "Fix ONLY these findings" in prompt:
        bump("fix_calls")
        open(os.path.join(state, "fixed.txt"), "w").write("fixed")
    elif "fresh-context reviewer" in prompt:
        n = bump("review_calls")
        with open(os.path.join(state, "review_prompt.txt"), "w") as f:
            f.write(prompt)
        mode = os.environ.get("STUB_REVIEW", "clean")
        if mode == "unparseable":
            print("Looks pretty good to me!")
        elif mode == "object_items":
            print(json.dumps({"must_fix": [{"file": "a.py", "issue": "sql injection"}]}))
        elif mode == "marker_clean":
            print("MUST_FIX: none")
        elif mode == "marker_fix":
            print("MUST_FIX: 1")
            print("### MUST_FIX")
            print("- src/foo.ts:1 stub finding; do the fix")
        elif mode == "clean" or (mode == "fix_once" and n >= 2):
            print(json.dumps({"must_fix": [], "should_fix": ["src/foo.ts:2 minor style nit"]}))
        else:
            print(
                json.dumps(
                    {
                        "must_fix": ["src/foo.ts:1 stub finding; do the fix"],
                        "should_fix": [],
                    }
                )
            )
    else:
        bump("writer_calls")
        open("artifact.txt", "w").write("built")
    '''
)


def _make_repo(phase_overrides: dict | None = None, md: str | None = None) -> Path:
    tmp = Path(tempfile.mkdtemp(prefix="harness-run-"))
    shutil.copytree(SCRIPTS_DIR, tmp / "scripts", ignore=shutil.ignore_patterns("__pycache__"))

    (tmp / ".gitignore").write_text(
        ".harness/\nstate/\nagent_stub.py\nalt_reviewer.py\n__pycache__/\n"
    )
    (tmp / "docs").mkdir()
    (tmp / "docs/PRD.md").write_text(FILLED_DOC)
    (tmp / "docs/ARCHITECTURE.md").write_text(FILLED_DOC)
    (tmp / "docs/BACKLOG.md").write_text(BACKLOG_SEED)
    (tmp / "AGENTS.md").write_text(FILLED_AGENTS)

    stub = tmp / "agent_stub.py"
    stub.write_text(AGENT_STUB)
    stub.chmod(0o755)

    (tmp / "state").mkdir()

    phase = {
        "id": "01-foo",
        "title": "Foo phase",
        "status": "pending",
        "acceptance": ["artifact exists"],
        "verification_cmd": "test -f artifact.txt",
    }
    phase.update(phase_overrides or {})
    (tmp / "phases").mkdir()
    (tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))
    (tmp / "phases/01-foo.md").write_text(
        md
        if md is not None
        else "# Phase foo\n\n## Goal\n\nBuild artifact.\n\n## Acceptance\n\n- artifact exists\n"
    )

    subprocess.run(["git", "init", "-q", "-b", "main"], cwd=tmp, check=True)
    subprocess.run(["git", "config", "user.email", "t@t"], cwd=tmp, check=True)
    subprocess.run(["git", "config", "user.name", "t"], cwd=tmp, check=True)
    # Baseline commit: in real use the repo has history and only the
    # phase's work is uncommitted — the scope check depends on that.
    subprocess.run(["git", "add", "-A"], cwd=tmp, check=True)
    subprocess.run(["git", "commit", "-q", "-m", "baseline"], cwd=tmp, check=True)
    return tmp


def _run(
    tmp: Path,
    extra_env: dict | None = None,
    args: list[str] | None = None,
    use_global_env: bool = True,
):
    env = {
        **os.environ,
        "CLAUDE_PROJECT_DIR": str(tmp),
        "STUB_STATE_DIR": str(tmp / "state"),
    }
    env.pop("HARNESS_SKIP_SMOKE", None)
    if use_global_env:
        env["HARNESS_CLAUDE_CMD"] = f"{sys.executable} {tmp / 'agent_stub.py'}"
    else:
        env.pop("HARNESS_CLAUDE_CMD", None)
    if extra_env:
        env.update(extra_env)
    return subprocess.run(
        [sys.executable, str(tmp / "scripts/execute.py"), "run", "01-foo"] + (args or []),
        cwd=tmp,
        capture_output=True,
        text=True,
        timeout=60,
        env=env,
    )


def _calls(tmp: Path, name: str) -> int:
    path = tmp / "state" / name
    return int(path.read_text()) if path.exists() else 0


def _phase(tmp: Path) -> dict:
    return json.loads((tmp / "phases/01-foo.json").read_text())


def _retro(tmp: Path) -> dict:
    return json.loads((tmp / "phases/01-foo.retro.json").read_text())


class TestRunPipeline(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = _make_repo()

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_happy_path_completes_and_commits(self) -> None:
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        phase = _phase(self.tmp)
        self.assertEqual(phase["status"], "completed")
        self.assertEqual(phase["stage"], "commit")
        self.assertEqual(_calls(self.tmp, "writer_calls"), 1)
        self.assertEqual(_calls(self.tmp, "review_calls"), 1)
        self.assertEqual(_calls(self.tmp, "retro_calls"), 1)
        retro = _retro(self.tmp)
        self.assertEqual(retro["drafted_by"], "agent")
        self.assertEqual(retro["phase_id"], "01-foo")
        log = subprocess.run(
            ["git", "log", "--format=%s"], cwd=self.tmp, capture_output=True, text=True
        ).stdout
        self.assertIn("phase(01): Foo phase", log)
        dirty = subprocess.run(
            ["git", "status", "--porcelain"], cwd=self.tmp, capture_output=True, text=True
        ).stdout.strip()
        self.assertEqual(dirty, "", msg="everything should be committed")

    def test_lint_failure_spawns_no_agents(self) -> None:
        (self.tmp / "phases/01-foo.md").write_text("# Phase foo\n\nNo acceptance heading.\n")
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 2)
        self.assertIn("LINT FAILED", result.stderr)
        self.assertEqual(_calls(self.tmp, "writer_calls"), 0)
        self.assertEqual(_phase(self.tmp)["status"], "pending")

    def test_must_fix_dispatches_fix_and_rereviews(self) -> None:
        result = _run(self.tmp, extra_env={"STUB_REVIEW": "fix_once"})
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertEqual(_calls(self.tmp, "review_calls"), 2)
        self.assertEqual(_calls(self.tmp, "fix_calls"), 1)
        self.assertEqual(_phase(self.tmp)["status"], "completed")
        self.assertEqual(_phase(self.tmp)["review_cycles"], 1)

    def test_persistent_must_fix_goes_to_needs_human(self) -> None:
        result = _run(self.tmp, extra_env={"STUB_REVIEW": "always_fix"})
        self.assertEqual(result.returncode, 2)
        phase = _phase(self.tmp)
        self.assertEqual(phase["status"], "needs_human")
        # max_review_cycles=2 -> initial review + 2 fix cycles' re-reviews.
        self.assertEqual(_calls(self.tmp, "review_calls"), 3)
        self.assertEqual(_calls(self.tmp, "fix_calls"), 2)
        backlog = (self.tmp / "docs/BACKLOG.md").read_text()
        self.assertIn("[P1] Phase 01-foo", backlog)
        self.assertNotIn("retro_calls", os.listdir(self.tmp / "state"))

    def test_unparseable_review_goes_to_needs_human(self) -> None:
        result = _run(self.tmp, extra_env={"STUB_REVIEW": "unparseable"})
        self.assertEqual(result.returncode, 2)
        self.assertEqual(_phase(self.tmp)["status"], "needs_human")
        self.assertIn("REVIEW UNPARSEABLE", result.stderr)

    def test_gate_failure_resumes_without_rewriting(self) -> None:
        phase = _phase(self.tmp)
        phase["gates"] = ["false"]
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))

        result = _run(self.tmp)
        self.assertEqual(result.returncode, 1)
        mid = _phase(self.tmp)
        self.assertEqual(mid["status"], "in_progress")
        self.assertEqual(mid["stage"], "write")
        self.assertEqual(_calls(self.tmp, "writer_calls"), 1)

        mid["gates"] = ["true"]
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(mid, indent=2))
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        # Resume skipped the write stage — the writer ran exactly once.
        self.assertEqual(_calls(self.tmp, "writer_calls"), 1)
        self.assertEqual(_phase(self.tmp)["status"], "completed")

    def test_completed_phase_refuses_rerun(self) -> None:
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 2)
        self.assertIn("already completed", result.stderr)

    def test_smoke_skip_injects_retro_followup(self) -> None:
        phase = _phase(self.tmp)
        phase["smoke_cmd"] = "false"
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))
        result = _run(self.tmp, extra_env={"HARNESS_SKIP_SMOKE": "no docker on this runner"})
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        retro = _retro(self.tmp)
        skips = [f for f in retro["followups"] if f.lower().startswith("smoke skipped:")]
        self.assertEqual(len(skips), 1)
        self.assertIn("no docker", skips[0])
        self.assertEqual(retro["smoke_run"]["result"], "skipped")

    def test_smoke_failure_stops_before_review(self) -> None:
        phase = _phase(self.tmp)
        phase["smoke_cmd"] = "false"
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(_calls(self.tmp, "review_calls"), 0)
        self.assertEqual(_phase(self.tmp)["stage"], "gates")

    def test_retro_draft_failure_falls_back_to_skeleton(self) -> None:
        result = _run(self.tmp, extra_env={"STUB_RETRO": "garbage"})
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        retro = _retro(self.tmp)
        self.assertEqual(retro["drafted_by"], "agent")
        self.assertTrue(any("auto-draft failed" in f for f in retro["followups"]))
        self.assertEqual(_phase(self.tmp)["status"], "completed")

    def test_smoke_pass_recorded_in_retro(self) -> None:
        phase = _phase(self.tmp)
        phase["smoke_cmd"] = "true"
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))
        result = _run(self.tmp, extra_env={"STUB_RETRO": "garbage"})
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        # The mechanical fallback carries the recorded smoke_run verbatim.
        self.assertEqual(_retro(self.tmp)["smoke_run"]["result"], "pass")

    def test_role_env_beats_global_env(self) -> None:
        # A dedicated reviewer command takes precedence over
        # HARNESS_CLAUDE_CMD; other roles keep using the global stub.
        alt = self.tmp / "alt_reviewer.py"
        alt.write_text(
            "#!/usr/bin/env python3\n"
            "import os\n"
            "state = os.environ['STUB_STATE_DIR']\n"
            "p = os.path.join(state, 'alt_reviewer_calls')\n"
            "n = int(open(p).read()) if os.path.exists(p) else 0\n"
            "open(p, 'w').write(str(n + 1))\n"
            "print('MUST_FIX: none')\n"
        )
        result = _run(
            self.tmp,
            extra_env={"HARNESS_REVIEWER_CMD": f"{sys.executable} {alt}"},
        )
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertEqual(_calls(self.tmp, "alt_reviewer_calls"), 1)
        self.assertEqual(_calls(self.tmp, "review_calls"), 0)
        self.assertEqual(_calls(self.tmp, "writer_calls"), 1)

    def test_phase_agent_cmds_beat_config_when_no_env(self) -> None:
        # No env override: the phase JSON's agent_cmds shadow a broken
        # config-level writer command, and config serves the rest.
        stub_cmd = f"{sys.executable} {self.tmp / 'agent_stub.py'}"
        (self.tmp / "harness.config.json").write_text(
            json.dumps(
                {
                    "agent_cmds": {
                        "writer": "false",
                        "fixer": stub_cmd,
                        "reviewer": stub_cmd,
                        "retro": stub_cmd,
                    }
                }
            )
        )
        phase = _phase(self.tmp)
        phase["agent_cmds"] = {"writer": stub_cmd}
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))
        result = _run(self.tmp, use_global_env=False)
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertEqual(_calls(self.tmp, "writer_calls"), 1)
        self.assertEqual(_calls(self.tmp, "review_calls"), 1)
        self.assertEqual(_phase(self.tmp)["status"], "completed")

    def test_restart_reruns_writer(self) -> None:
        phase = _phase(self.tmp)
        phase["gates"] = ["false"]
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))
        _run(self.tmp)
        self.assertEqual(_calls(self.tmp, "writer_calls"), 1)

        mid = _phase(self.tmp)
        mid["gates"] = ["true"]
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(mid, indent=2))
        result = _run(self.tmp, args=["--restart"])
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertEqual(_calls(self.tmp, "writer_calls"), 2)

    def test_green_verifier_refused(self) -> None:
        # Phase-level TDD: a verifier that passes before any work is
        # tautological (the empty-workspace false-positive class).
        phase = _phase(self.tmp)
        phase["verification_cmd"] = "true"
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 2)
        self.assertIn("VERIFIER ALREADY GREEN", result.stderr)
        self.assertEqual(_calls(self.tmp, "writer_calls"), 0)

    def test_green_verifier_env_escape(self) -> None:
        phase = _phase(self.tmp)
        phase["verification_cmd"] = "true"
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))
        result = _run(self.tmp, extra_env={"HARNESS_ALLOW_GREEN_VERIFIER": "1"})
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertEqual(_phase(self.tmp)["status"], "completed")

    def test_dirty_tree_refused_on_fresh_run(self) -> None:
        (self.tmp / "stray.txt").write_text("uncommitted junk\n")
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 2)
        self.assertIn("DIRTY TREE", result.stderr)
        self.assertIn("stray.txt", result.stderr)
        self.assertEqual(_calls(self.tmp, "writer_calls"), 0)

    def test_dirty_tree_allowed_with_flag(self) -> None:
        (self.tmp / "stray.txt").write_text("uncommitted junk\n")
        result = _run(self.tmp, args=["--allow-dirty"])
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertEqual(_phase(self.tmp)["status"], "completed")

    def test_non_string_must_fix_items_fail_closed(self) -> None:
        # A reviewer returning objects instead of strings must NOT count
        # as zero findings — that would ship an unreviewed phase.
        result = _run(self.tmp, extra_env={"STUB_REVIEW": "object_items"})
        self.assertEqual(result.returncode, 2)
        self.assertEqual(_phase(self.tmp)["status"], "needs_human")
        self.assertIn("REVIEW UNPARSEABLE", result.stderr)
        self.assertIn("sql injection", _phase(self.tmp)["review_findings"])

    def test_marker_fallback_still_parses(self) -> None:
        # Legacy MUST_FIX: marker output (hand-run or off-contract
        # reviewer) must keep working.
        result = _run(self.tmp, extra_env={"STUB_REVIEW": "marker_clean"})
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertEqual(_phase(self.tmp)["status"], "completed")

    def test_marker_fallback_must_fix_gates(self) -> None:
        result = _run(self.tmp, extra_env={"STUB_REVIEW": "marker_fix"})
        self.assertEqual(result.returncode, 2)
        self.assertEqual(_phase(self.tmp)["status"], "needs_human")
        self.assertEqual(_calls(self.tmp, "fix_calls"), 2)

    def test_should_fix_recorded_for_retro(self) -> None:
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        findings = _phase(self.tmp)["review_findings"]
        self.assertIn("SHOULD_FIX", findings)
        self.assertIn("minor style nit", findings)

    def test_scope_guard_flags_out_of_scope_files(self) -> None:
        # The writer stub creates artifact.txt, which matches none of
        # the declared globs — the reviewer brief must flag it.
        phase = _phase(self.tmp)
        phase["files"] = ["src/**"]
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertIn("artifact.txt", _phase(self.tmp)["out_of_scope_files"])
        brief = (self.tmp / "state/review_prompt.txt").read_text()
        self.assertIn("Scope check", brief)
        self.assertIn("artifact.txt", brief)

    def test_no_files_globs_means_no_scope_section(self) -> None:
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        brief = (self.tmp / "state/review_prompt.txt").read_text()
        self.assertNotIn("Scope check", brief)

    def test_in_scope_changes_not_flagged(self) -> None:
        phase = _phase(self.tmp)
        phase["files"] = ["artifact.txt"]
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertEqual(_phase(self.tmp)["out_of_scope_files"], [])

    def test_transcripts_written_per_role(self) -> None:
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        tdir = self.tmp / ".harness/transcripts/01-foo"
        self.assertTrue((tdir / "writer-1.log").exists())
        self.assertTrue((tdir / "reviewer-1.log").exists())
        self.assertTrue((tdir / "retro-1.log").exists())
        content = (tdir / "writer-1.log").read_text()
        self.assertIn("=== PROMPT ===", content)
        self.assertIn("=== OUTPUT ===", content)

    def test_live_lock_refuses_concurrent_run(self) -> None:
        locks = self.tmp / ".harness/locks"
        locks.mkdir(parents=True)
        # This test process is alive, so its pid is a live holder.
        (locks / "01-foo.lock").write_text(str(os.getpid()))
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 2)
        self.assertIn("already being run", result.stderr)
        self.assertEqual(_calls(self.tmp, "writer_calls"), 0)

    def test_stale_lock_is_stolen(self) -> None:
        locks = self.tmp / ".harness/locks"
        locks.mkdir(parents=True)
        (locks / "01-foo.lock").write_text("999999999")
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        self.assertFalse((locks / "01-foo.lock").exists(), msg="lock released after run")

    def test_lock_released_after_failed_run(self) -> None:
        phase = _phase(self.tmp)
        phase["gates"] = ["false"]
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))
        result = _run(self.tmp)
        self.assertEqual(result.returncode, 1)
        self.assertFalse((self.tmp / ".harness/locks/01-foo.lock").exists())

    def test_verification_timeout_counts_as_failure(self) -> None:
        (self.tmp / "harness.config.json").write_text(json.dumps({"command_timeout_sec": 1}))
        phase = _phase(self.tmp)
        phase["verification_cmd"] = "sleep 5"
        (self.tmp / "phases/01-foo.json").write_text(json.dumps(phase, indent=2))
        result = _run(self.tmp, extra_env={"HARNESS_MAX_ATTEMPTS": "1"})
        self.assertEqual(result.returncode, 2)
        self.assertIn("EXHAUSTED", result.stderr)
        backlog = (self.tmp / "docs/BACKLOG.md").read_text()
        self.assertIn("timed out after 1s", backlog)


if __name__ == "__main__":
    unittest.main()
