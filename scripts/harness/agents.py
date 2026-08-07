"""Agent command resolution and subprocess spawning.

Four roles are spawned by the pipeline: writer, fixer, reviewer, retro.
Each resolves its command independently (see resolve_agent_cmd).
"""

from __future__ import annotations

import os
import shlex
import subprocess

from harness.context import HARNESS_PARENT_ENV, REPO_ROOT, get_config

DEFAULT_AGENT_CMD = "claude --permission-mode auto --model opus"
AGENT_ROLES = ("writer", "fixer", "reviewer", "retro")

# Strings in a spawned agent's stdout/stderr that mean it couldn't
# actually edit/run anything (permission mode denied writes, auth
# failed). Verifier output is unreliable when the writer no-op'd, so we
# short-circuit to a retry.
WRITER_FAILURE_SIGNALS = (
    "Permission denied. Need approval",
    "Permission denied (Permission denied)",
    "Invalid API key",
    "authentication_error",
    "rate_limit_error",
)


def resolve_agent_cmd(role: str, phase: dict | None = None) -> list[str]:
    """Resolve the agent command for a role, most specific wins:

    1. HARNESS_<ROLE>_CMD env (e.g. HARNESS_REVIEWER_CMD)
    2. HARNESS_CLAUDE_CMD env (global override — also how tests stub
       every role at once)
    3. phase JSON `agent_cmds[role]` (per-phase, e.g. a stronger
       reviewer for a hard phase)
    4. harness.config.json `agent_cmds[role]`
    5. DEFAULT_AGENT_CMD
    """
    env_role = os.environ.get(f"HARNESS_{role.upper()}_CMD")
    if env_role:
        return shlex.split(env_role)
    env_all = os.environ.get("HARNESS_CLAUDE_CMD")
    if env_all:
        return shlex.split(env_all)
    for source in ((phase or {}).get("agent_cmds") or {}, get_config().get("agent_cmds") or {}):
        cmd = source.get(role)
        if cmd:
            return shlex.split(cmd)
    return shlex.split(DEFAULT_AGENT_CMD)


def _write_transcript(phase: dict | None, role: str, task: str, output: str) -> None:
    """Persist the full agent exchange to .harness/transcripts/ for
    post-mortem debugging (the pipeline otherwise keeps only a
    500-char error tail). Machine-local, gitignored, fail-open.
    """
    try:
        phase_id = (phase or {}).get("id", "adhoc")
        tdir = REPO_ROOT / ".harness" / "transcripts" / phase_id
        tdir.mkdir(parents=True, exist_ok=True)
        n = sum(1 for p in tdir.glob(f"{role}-*.log")) + 1
        (tdir / f"{role}-{n}.log").write_text(
            f"=== PROMPT ===\n{task}\n\n=== OUTPUT ===\n{output}\n"
        )
    except Exception:
        pass  # logging must never affect the run


def spawn_agent(task: str, role: str = "writer", phase: dict | None = None) -> tuple[bool, str]:
    """Run the role's agent command with the given prompt.

    Returns (failed, combined_output). `failed` is True on nonzero exit,
    a known permission/auth failure signal in the output, or a timeout
    (`agent_timeout_sec` in harness.config.json) — cases where the agent
    never actually finished the work.
    """
    timeout = int(get_config()["agent_timeout_sec"])
    try:
        proc = subprocess.run(
            resolve_agent_cmd(role, phase) + ["-p", task],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            env={**os.environ, HARNESS_PARENT_ENV: "1"},
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        output = f"{role} agent timed out after {timeout}s (agent_timeout_sec)"
        _write_transcript(phase, role, task, output)
        return True, output
    output = (proc.stdout or "") + (proc.stderr or "")
    _write_transcript(phase, role, task, output)
    # Failure-signal sniffing applies only to code-producing roles: a
    # reviewer or retro drafter QUOTING e.g. "rate_limit_error" in a
    # finding must not mark its own run as failed. Those roles are
    # already guarded by their strict output parsing.
    sniff = role in ("writer", "fixer")
    failed = proc.returncode != 0 or (
        sniff and any(sig in output for sig in WRITER_FAILURE_SIGNALS)
    )
    return failed, output
