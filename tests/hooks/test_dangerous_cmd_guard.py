"""Unittest suite for dangerous_cmd_guard.

Each entry in DENY_CASES / ALLOW_CASES / WRONG_TOOL_CASES is materialised
as its own TestCase method so `python3 -m unittest discover tests -v`
reports individually pass/fail per case.

Each method runs the hook subprocess against an isolated tmpdir set as
CLAUDE_PROJECT_DIR so audit-log writes (Item 1) don't pollute the real
repo.

Run:
    python3 -m unittest discover tests -v
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HOOK = Path(__file__).resolve().parents[2] / "scripts/hooks/dangerous_cmd_guard.py"


def _bash(cmd: str) -> dict:
    return {"tool_name": "Bash", "tool_input": {"command": cmd}, "cwd": "."}


def _run(payload: dict, project_dir: Path) -> tuple[int, dict | None]:
    env = {**os.environ, "CLAUDE_PROJECT_DIR": str(project_dir)}
    proc = subprocess.run(
        [sys.executable, str(HOOK)],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        timeout=10,
        env=env,
    )
    out = json.loads(proc.stdout) if proc.stdout.strip() else None
    return proc.returncode, out


def _is_deny(payload: dict, project_dir: Path) -> bool:
    code, out = _run(payload, project_dir)
    return (
        code == 0
        and out is not None
        and out.get("hookSpecificOutput", {}).get("permissionDecision") == "deny"
    )


def _is_allow(payload: dict, project_dir: Path) -> bool:
    code, out = _run(payload, project_dir)
    return code == 0 and out is None


DENY_CASES = [
    "rm -rf /",
    "rm -rf /  ",
    "rm -rf /etc/passwd",
    "rm -rf /usr/local",
    "rm -fr /var",
    "rm -Rf /home/foo",
    "rm -rf ~",
    "rm -rf ~/Library",
    "rm -rf *",
    "git push --force origin main",
    "git push -f origin master",
    "git push origin main --force",
    "git push origin master -f",
    "git push --force origin/main",
    "git push -f origin HEAD:main",
    "git push --force origin HEAD:master",
    "git push origin HEAD:main --force",
    "git reset --hard HEAD~3",
    "git clean -fd",
    "git clean -dfx",
    "git branch -D feature/foo",
    "DROP TABLE users;",
    "drop database analytics",
    "TRUNCATE TABLE events",
    "kubectl delete pod foo",
    "kubectl delete -f deploy.yaml",
    "pnpm publish",
    "npm publish --access public",
    "poetry publish",
    "mkfs.ext4 /dev/sda1",
    "dd if=/dev/zero of=/dev/sda bs=1M",
    "git push origin +main",
    "git push origin +master",
    "rm --recursive --force /",
    "rm -r -f /",
    "rm --recursive --force ~/",
    ":(){ :|:& };:",
    "pnpm drizzle-kit push",
    "railway down",
    "railway service delete api",
    "stripe products delete prod_123",
    "psql -c 'delete from artists'",
]

ALLOW_CASES = [
    "ls -la",
    "echo hello",
    "rm -rf /tmp/build",
    "rm -rf /tmp/harness-cache",
    "rm -rf node_modules",
    "rm -rf dist",
    "git status",
    "git push origin feature/foo",
    "git push --force origin feature/bar",
    "git push --force-with-lease origin main",
    "git push --force-with-lease origin master",
    "git push origin feature/main-thing",
    "git push origin release/maintenance",
    "git push --force origin feature/master-list",
    "git push origin +feature/foo",
    "rm --recursive --force ./build",
    "pnpm drizzle-kit generate",
    "pnpm drizzle-kit migrate",
    "railway status",
    "railway logs",
    "stripe products list",
    "psql -c 'delete from artists where id = 1'",
    "git reset --hard",
    "git commit -m 'fix: foo'",
    "pnpm install",
    "pnpm test",
    "pytest tests/",
    "kubectl get pods",
    "kubectl apply -f deploy.yaml",
]

WRONG_TOOL_CASES = [
    {
        "tool_name": "Edit",
        "tool_input": {"file_path": "/x", "old_string": "rm -rf /", "new_string": "y"},
        "cwd": ".",
    },
    {"tool_name": "Write", "tool_input": {"file_path": "/x", "content": "rm -rf /"}, "cwd": "."},
]


class _TmpdirMixin(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="harness-dcg-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)


class TestDenyCases(_TmpdirMixin):
    pass


class TestAllowCases(_TmpdirMixin):
    pass


class TestWrongToolCases(_TmpdirMixin):
    pass


class TestAuditLogIntegration(_TmpdirMixin):
    """End-to-end audit log behaviour as observed via the hook subprocess."""

    def test_deny_writes_audit_line(self) -> None:
        self.assertTrue(_is_deny(_bash("rm -rf /"), self.tmp))
        audit_file = self.tmp / ".harness/audit.jsonl"
        self.assertTrue(audit_file.exists(), "audit.jsonl should be created")
        lines = audit_file.read_text().splitlines()
        self.assertEqual(len(lines), 1)
        event = json.loads(lines[0])
        self.assertEqual(event["hook"], "dangerous_cmd_guard")
        self.assertEqual(event["tool"], "Bash")
        self.assertEqual(event["decision"], "deny")
        self.assertIn("ts", event)
        self.assertIn("rm -rf /", event["input_summary"])
        self.assertIn("rm -rf at filesystem root", event["reason"])

    def test_allow_writes_no_audit_line(self) -> None:
        self.assertTrue(_is_allow(_bash("ls -la"), self.tmp))
        audit_file = self.tmp / ".harness/audit.jsonl"
        if audit_file.exists():
            self.assertEqual(audit_file.read_text(), "")

    def test_deny_succeeds_when_audit_write_fails(self) -> None:
        # Block .harness/ creation by squatting a regular file there.
        (self.tmp / ".harness").write_text("blocker")
        # Hook must still emit deny even though the audit write fails.
        self.assertTrue(_is_deny(_bash("DROP TABLE users"), self.tmp))

    def test_multiple_denies_append_in_order(self) -> None:
        _is_deny(_bash("rm -rf /"), self.tmp)
        _is_deny(_bash("DROP TABLE users"), self.tmp)
        _is_deny(_bash("kubectl delete pod foo"), self.tmp)
        lines = (self.tmp / ".harness/audit.jsonl").read_text().splitlines()
        self.assertEqual(len(lines), 3)
        reasons = [json.loads(line)["reason"] for line in lines]
        self.assertIn("rm -rf at filesystem root", reasons[0])
        self.assertIn("SQL DROP TABLE/DATABASE", reasons[1])
        self.assertIn("kubectl delete", reasons[2])


def _sanitize(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "_", s).strip("_")[:48] or "case"


def _make_deny(cmd: str):
    def test(self):
        self.assertTrue(_is_deny(_bash(cmd), self.tmp), f"DENY expected for: {cmd!r}")

    return test


def _make_allow(cmd: str):
    def test(self):
        self.assertTrue(_is_allow(_bash(cmd), self.tmp), f"ALLOW expected for: {cmd!r}")

    return test


def _make_wrong(payload: dict):
    def test(self):
        self.assertTrue(
            _is_allow(payload, self.tmp), f"wrong-tool ALLOW expected: {payload['tool_name']}"
        )

    return test


for _i, _cmd in enumerate(DENY_CASES):
    setattr(TestDenyCases, f"test_{_i:03d}_{_sanitize(_cmd)}", _make_deny(_cmd))
for _i, _cmd in enumerate(ALLOW_CASES):
    setattr(TestAllowCases, f"test_{_i:03d}_{_sanitize(_cmd)}", _make_allow(_cmd))
for _i, _p in enumerate(WRONG_TOOL_CASES):
    setattr(TestWrongToolCases, f"test_{_i:03d}_{_p['tool_name']}", _make_wrong(_p))


if __name__ == "__main__":
    unittest.main()
