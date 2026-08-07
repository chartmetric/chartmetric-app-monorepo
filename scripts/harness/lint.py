"""Pre-flight phase validation. No agents spawned, no repo mutation.

Exists because a 5-character typo in a `verification_cmd` file path
once burned an entire retry budget (`test -f` fails silently), and
because phase JSON and .md acceptance lists have drifted apart.
"""

from __future__ import annotations

import re
from fnmatch import fnmatch
from pathlib import Path

from harness.context import REPO_ROOT, get_config
from harness.state import VALID_STATUSES, load_phases

_PATH_TOKEN_RE = re.compile(r"^[\w@.+-]+(?:/[\w@.+-]+)+\.[A-Za-z0-9_]+$")
_ACCEPTANCE_HEADING_RE = re.compile(r"^#+\s*acceptance\b", re.IGNORECASE)
# Top-level bullets only (no leading indent) — nested sub-bullets under
# an acceptance criterion must not inflate the count.
_BULLET_RE = re.compile(r"^(?:[-*+]|\d+[.)])\s+\S")


def _extract_path_tokens(cmd: str) -> list[str]:
    """Best-effort extraction of file-path-looking tokens from a shell command."""
    tokens: list[str] = []
    for raw in re.split(r"[\s;&|()'\"]+", cmd):
        tok = raw.strip()
        if not tok or tok.startswith("-"):
            continue
        if _PATH_TOKEN_RE.match(tok):
            tokens.append(tok)
    return tokens


def _matches_test_convention(basename: str, conventions: list[str]) -> bool:
    return any(fnmatch(basename, pat) for pat in conventions)


def _acceptance_bullet_count(spec_text: str) -> int | None:
    """Count bullets under the spec's Acceptance heading. None = no heading."""
    lines = spec_text.splitlines()
    start = None
    level = 0
    for i, line in enumerate(lines):
        if _ACCEPTANCE_HEADING_RE.match(line.strip()):
            start = i
            level = len(line.strip()) - len(line.strip().lstrip("#"))
            break
    if start is None:
        return None
    count = 0
    for line in lines[start + 1 :]:
        stripped = line.strip()
        if stripped.startswith("#"):
            heading_level = len(stripped) - len(stripped.lstrip("#"))
            if heading_level <= level:
                break
        if _BULLET_RE.match(line):
            count += 1
    return count


def lint_phase(phase: dict, spec_text: str | None) -> list[str]:
    """Return lint errors for a phase JSON + its .md spec. Empty = clean."""
    config = get_config()
    errors: list[str] = []

    for key in ("id", "title", "status"):
        if not isinstance(phase.get(key), str) or not phase.get(key):
            errors.append(f"required key missing or not a string: {key}")
    if errors:
        return errors

    path = Path(phase["_path"])
    if path.stem != phase["id"]:
        errors.append(f"id {phase['id']!r} does not match filename {path.name!r}")
    if phase["status"] not in VALID_STATUSES:
        errors.append(f"invalid status: {phase['status']!r}")

    for key, typ in (
        ("depends_on", list),
        ("acceptance", list),
        ("files", list),
        ("gates", list),
    ):
        if key in phase and not isinstance(phase[key], typ):
            errors.append(f"{key} must be a {typ.__name__}")
    for key in ("verification_cmd", "smoke_cmd", "notes"):
        if key in phase and not isinstance(phase[key], str):
            errors.append(f"{key} must be a string")

    known_ids = {p["id"] for p in load_phases()}
    for dep in phase.get("depends_on", []) or []:
        if dep not in known_ids:
            errors.append(f"depends_on references unknown phase: {dep}")

    if spec_text is None:
        errors.append(f"phase spec missing: phases/{phase['id']}.md")
        return errors

    # Acceptance drift: JSON list vs the spec's Acceptance section.
    acceptance = phase.get("acceptance") or []
    bullet_count = _acceptance_bullet_count(spec_text)
    if bullet_count is None:
        errors.append("spec .md has no `## Acceptance` heading — writer and verifier can drift")
    elif len(acceptance) != bullet_count:
        errors.append(
            f"acceptance drift: JSON lists {len(acceptance)} criteria, "
            f"spec .md Acceptance section has {bullet_count} bullets — reconcile them"
        )

    # verification_cmd path cross-check.
    verification_cmd = phase.get("verification_cmd", "")
    known_files = " ".join(phase.get("files") or [])
    conventions = config["test_file_conventions"]
    for tok in _extract_path_tokens(verification_cmd):
        basename = Path(tok).name
        parts = Path(tok).parts
        in_test_dir = any(seg in ("test", "tests", "__tests__") for seg in parts)
        looks_like_test = in_test_dir or "test" in basename.lower() or "spec" in basename.lower()
        if looks_like_test and not _matches_test_convention(basename, conventions):
            errors.append(
                f"verification_cmd references {tok!r} which matches no configured "
                f"test filename convention {conventions} — a typo here fails "
                f"silently and burns the whole retry budget"
            )
        if not (REPO_ROOT / tok).exists() and tok not in spec_text and tok not in known_files:
            errors.append(
                f"verification_cmd references {tok!r}: file does not exist and is "
                f"not mentioned in the spec .md or the phase `files` list — the "
                f"writer will never know to create it"
            )

    return errors
