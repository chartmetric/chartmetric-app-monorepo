"""`doctor` — first-run environment check for repos created from the
template. Verifies the harness can actually run before any phase does.

FAIL = the harness cannot run; exit 1.
WARN = will bite later (missing agent binary, unwired hooks); exit 0.
INFO = expected states worth knowing (skeleton docs on a fresh repo).
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys

from harness.agents import AGENT_ROLES, resolve_agent_cmd
from harness.context import PHASES_DIR, REPO_ROOT
from harness.docs_gate import precheck_advisories, precheck_failures

FAIL = "✗"
WARN = "!"
OK = "✓"


def _check_python(results: list) -> None:
    version = (sys.version_info.major, sys.version_info.minor)
    if version < (3, 10):
        results.append((FAIL, f"python >= 3.10 required (running {sys.version.split()[0]})"))
    else:
        results.append((OK, f"python {sys.version.split()[0]}"))


def _check_git(results: list) -> None:
    try:
        proc = subprocess.run(
            ["git", "rev-parse", "--is-inside-work-tree"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=30,
        )
    except subprocess.TimeoutExpired:
        results.append((FAIL, "git rev-parse timed out"))
        return
    if proc.returncode != 0:
        results.append((FAIL, "not a git repository — the pipeline commits phases; run git init"))
    else:
        results.append((OK, "git repository"))


def _check_config(results: list) -> bool:
    """Returns False when the config is broken — dependent checks skip."""
    # Import here so a broken config reports as a finding, not a crash.
    from _config import CONFIG_FILE_NAME, clear_cache, load_config

    try:
        clear_cache()
        load_config(REPO_ROOT)
        results.append((OK, f"{CONFIG_FILE_NAME} loads and types check out"))
        return True
    except Exception as e:  # noqa: BLE001 — report every load failure the same way
        results.append((FAIL, f"{CONFIG_FILE_NAME} is broken: {e}"))
        return False


def _check_agent_cmds(results: list) -> None:
    seen: dict[str, list[str]] = {}
    for role in AGENT_ROLES:
        try:
            binary = resolve_agent_cmd(role)[0]
        except Exception as e:  # noqa: BLE001
            results.append((FAIL, f"agent command for {role} unparseable: {e}"))
            continue
        seen.setdefault(binary, []).append(role)
    for binary, roles in seen.items():
        if shutil.which(binary):
            results.append((OK, f"agent binary {binary!r} on PATH ({', '.join(roles)})"))
        else:
            results.append(
                (
                    WARN,
                    f"agent binary {binary!r} not on PATH ({', '.join(roles)}) — "
                    f"install it or override via HARNESS_CLAUDE_CMD",
                )
            )


def _check_symlinks(results: list) -> None:
    """Spawned `claude -p` agents read CLAUDE.md and .claude/ to find the
    repo's instructions and skills. Both are per-machine symlinks here
    (gitignored, created during setup), so a fresh clone has neither —
    and an agent that cannot see AGENTS.md writes code against no
    conventions at all. FAIL, not WARN: the harness would still "work".
    """
    for link, target in ((".claude", ".agents"), ("CLAUDE.md", "AGENTS.md")):
        path = REPO_ROOT / link
        if path.exists():
            results.append((OK, f"{link} -> {target}"))
            continue
        # exists() follows symlinks, so a dangling link lands here too.
        state = "is a broken symlink" if path.is_symlink() else "missing"
        results.append(
            (
                FAIL,
                f"{link} {state} — spawned agents would read no repo instructions. "
                f"Run `ln -s {target} {link}` from the repo root (see README).",
            )
        )


def _check_hooks(results: list) -> None:
    settings_path = REPO_ROOT / ".agents" / "settings.json"
    if not settings_path.exists():
        results.append((WARN, ".agents/settings.json missing — PreToolUse hooks are not wired"))
        return
    try:
        settings = json.loads(settings_path.read_text())
    except json.JSONDecodeError as e:
        results.append((FAIL, f".agents/settings.json is not valid JSON: {e}"))
        return
    wired = json.dumps(settings)
    for hook in ("dangerous_cmd_guard.py",):
        script = REPO_ROOT / "scripts" / "hooks" / hook
        if not script.exists():
            results.append((FAIL, f"hook script missing: scripts/hooks/{hook}"))
        elif hook not in wired:
            results.append((WARN, f"{hook} exists but is not referenced in .agents/settings.json"))
        else:
            results.append((OK, f"hook wired: {hook}"))


def _check_phases(results: list) -> None:
    if not PHASES_DIR.exists():
        results.append((WARN, "phases/ directory missing — /harness will create it"))
        return
    for template in ("PHASE_TEMPLATE.md", "RETRO_TEMPLATE.json"):
        if not (PHASES_DIR / template).exists():
            results.append((WARN, f"phases/{template} missing — copy it back from the template"))
    results.append((OK, "phases/ present"))


def _check_docs(results: list) -> None:
    failures = precheck_failures()
    if failures:
        results.append(
            (
                "i",
                "required docs are still skeletons (expected on a fresh repo; "
                "phases will not run until filled):\n   "
                + "\n   ".join(f.strip() for f in failures),
            )
        )
    else:
        results.append((OK, "precheck passes — docs have substantive content"))

    advisories = precheck_advisories()
    if advisories:
        results.append(
            (
                WARN,
                "recommended docs are thin or absent (does not block a run):\n   "
                + "\n   ".join(a.strip() for a in advisories),
            )
        )


def run_doctor() -> int:
    results: list[tuple[str, str]] = []
    _check_python(results)
    _check_git(results)
    config_ok = _check_config(results)
    if config_ok:
        # These read the config themselves; a broken one already FAILed.
        _check_agent_cmds(results)
        _check_docs(results)
    _check_symlinks(results)
    _check_hooks(results)
    _check_phases(results)

    for marker, message in results:
        print(f" {marker} {message}")

    fails = [m for marker, m in results if marker == FAIL]
    warns = [m for marker, m in results if marker == WARN]
    print()
    if fails:
        print(f"doctor: {len(fails)} failure(s), {len(warns)} warning(s) — fix failures first")
        return 1
    print(f"doctor: ok ({len(warns)} warning(s))")
    return 0
