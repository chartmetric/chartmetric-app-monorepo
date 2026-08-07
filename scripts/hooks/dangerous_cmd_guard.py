#!/usr/bin/env python3
"""Block destructive Bash commands.

Reads PreToolUse JSON from stdin. If the proposed command matches any
pattern in DENYLIST, emit a `permissionDecision: deny` response and exit
0 (per Claude Code hooks contract). Otherwise exit 0 silently.

Patterns are conservative — block only commands whose blast radius is
hard to undo. Routine edits and tests are not in scope.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _audit import append_audit, resolve_repo_root  # noqa: E402

# Each entry: (regex pattern, human-readable reason).
DENYLIST: list[tuple[str, str]] = [
    (r"\brm\s+-[a-z]*r[a-z]*f?[a-z]*\s+/\s*($|;|&|\|)", "rm -rf at filesystem root"),
    (
        r"\brm\s+-[a-z]*r[a-z]*f?[a-z]*\s+/(bin|boot|etc|home|lib|opt|proc|root|sbin|sys|usr|var)\b",
        "rm -rf inside a system directory",
    ),
    (r"\brm\s+-[a-z]*r[a-z]*f?[a-z]*\s+~(/|\s|$)", "rm -rf under $HOME"),
    (r"\brm\s+-[a-z]*r[a-z]*f?[a-z]*\s+\*\s*($|;|&|\|)", "rm -rf * (wipe glob at root of cwd)"),
    # Order-independent: any of --force/-f anywhere AND a protected branch
    # anywhere on the same line. --force-with-lease is allowed via lookahead.
    # Left boundary on branch token uses `(?<![\w\-])` so `:` and `/` qualify
    # as valid preceding chars — catches refspec forms like `HEAD:main` and
    # `origin/main`. Right boundary `(?!\S)` keeps `feature/main-thing` etc.
    # out of the match.
    (
        r"\bgit\s+push\b(?=.*(?<!\S)(?:--force(?!-with-lease)|-f)(?!\S))"
        r"(?=.*(?<![\w\-])(?:main|master)(?!\S))",
        "force-push to protected branch",
    ),
    (r"\bgit\s+reset\s+--hard\b.*\bHEAD~", "git reset --hard rewinds shared history"),
    # `git clean -fd`, `-df`, `-dfx`, `-fdx`: needs both f and d anywhere
    # in the flag bundle, order-independent.
    (r"\bgit\s+clean\s+-(?=[a-z]*f)(?=[a-z]*d)[a-z]+\b", "git clean -fd discards untracked work"),
    (r"\bgit\s+branch\s+-D\b", "git branch -D force-deletes a branch"),
    (r"\bdrop\s+(table|database)\b", "SQL DROP TABLE/DATABASE"),
    (r"\btruncate\s+table\b", "SQL TRUNCATE TABLE"),
    (r"\bkubectl\s+delete\b", "kubectl delete (cluster mutation)"),
    (r"\bpnpm\s+publish\b", "pnpm publish (npm release)"),
    (r"\bnpm\s+publish\b", "npm publish"),
    (r"\bpoetry\s+publish\b", "poetry publish (PyPI release)"),
    (r":\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:", "fork bomb"),
    (r"\bmkfs\.[a-z0-9]+\b", "filesystem format"),
    (r"\bdd\s+.*of=/dev/(sd|nvme|disk)", "dd to block device"),
    # Refspec force syntax: `git push origin +main` force-pushes without
    # any --force flag.
    (
        r"\bgit\s+push\b(?=.*(?<!\S)\+(?:main|master)(?!\S))",
        "force-push via +refspec to protected branch",
    ),
    # Repo-specific, from the AGENTS.md security rules: never modify
    # production data, run production migrations, deploy to production,
    # or change Stripe products and entitlements.
    (r"\bdrizzle-kit\s+push\b", "drizzle-kit push applies schema changes with no migration file"),
    (r"\brailway\s+(down|redeploy)\b", "railway down/redeploy mutates deployed infrastructure"),
    (r"\brailway\b.*\bdelete\b", "railway delete removes deployed infrastructure"),
    (
        r"\bstripe\s+(products|prices|subscriptions|coupons)\s+(create|update|delete)\b",
        "Stripe product/entitlement mutation",
    ),
    (r"\bdelete\s+from\s+\S+\s*(;|$)", "SQL DELETE FROM with no WHERE clause"),
]


def _normalize(command: str) -> str:
    """Rewrite long-form / split flags into the short bundles the
    DENYLIST matches: `--recursive` -> `-r`, `--force` -> `-f`, and
    adjacent single-dash groups collapsed (`-r -f` -> `-rf`). The
    denylist runs against both the raw and normalized forms.
    """
    s = re.sub(r"(?<!\S)--recursive\b", "-r", command)
    s = re.sub(r"(?<!\S)--force\b(?!-with-lease)", "-f", s)
    prev = None
    while prev != s:
        prev = s
        s = re.sub(r"(?<!\S)-([a-zA-Z]+)\s+-([a-zA-Z]+)(?!\S)", r"-\1\2", s)
    return s


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0  # malformed — do not block

    if payload.get("tool_name") != "Bash":
        return 0

    command = (payload.get("tool_input") or {}).get("command", "")
    candidates = (command, _normalize(command))

    for pattern, reason in DENYLIST:
        if any(re.search(pattern, c, flags=re.IGNORECASE) for c in candidates):
            full_reason = (
                f"Blocked by dangerous_cmd_guard: {reason}. "
                f"If you really need this, run it outside Claude Code."
            )
            append_audit(
                resolve_repo_root(payload.get("cwd")),
                hook="dangerous_cmd_guard",
                tool="Bash",
                tool_input=payload.get("tool_input") or {},
                reason=full_reason,
            )
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": full_reason,
                }
            }
            print(json.dumps(output))
            return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
