"""Precheck: refuse phase work while required docs are skeletons."""

from __future__ import annotations

import re
from pathlib import Path

from harness.context import REPO_ROOT, get_config


def _count_substantive(lines: list[str]) -> int:
    """Count lines that are neither blank, markdown header, nor HTML comment."""
    in_comment = False
    count = 0
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if in_comment:
            if "-->" in line:
                in_comment = False
            continue
        if line.startswith("<!--"):
            if "-->" not in line[4:]:
                in_comment = True
            continue
        if line.startswith("#"):
            continue
        count += 1
    return count


def substantive_lines(path: Path) -> int:
    if not path.exists():
        return 0
    return _count_substantive(path.read_text().splitlines())


_AGENTS_SECTION_RE = re.compile(r"^## (\d+)\. ")


def agents_section_counts(path: Path) -> dict[int, int]:
    """Return {section_number: substantive_line_count} for the agents file.

    Sections are delimited by `## N. <title>` headers.
    """
    if not path.exists():
        return {}
    sections: dict[int, list[str]] = {}
    current: int | None = None
    for raw in path.read_text().splitlines():
        m = _AGENTS_SECTION_RE.match(raw)
        if m:
            current = int(m.group(1))
            sections.setdefault(current, [])
            continue
        if current is not None:
            sections[current].append(raw)
    return {num: _count_substantive(lines) for num, lines in sections.items()}


def precheck_failures() -> list[str]:
    """Empty list = all required docs have substantive content."""
    config = get_config()
    minimum = int(config["min_substantive_lines"])
    failures: list[str] = []
    for rel in config["required_docs"]:
        n = substantive_lines(REPO_ROOT / rel)
        if n < minimum:
            failures.append(f"  {rel}: {n} substantive line(s); need >= {minimum}")

    agents_rel = config["agents_file"]
    agents_path = REPO_ROOT / agents_rel
    if not agents_path.exists():
        failures.append(f"  {agents_rel}: file not found")
    else:
        counts = agents_section_counts(agents_path)
        for sec in config["agents_sections"]:
            n = counts.get(int(sec), 0)
            if n < minimum:
                failures.append(
                    f"  {agents_rel} section {sec}: {n} substantive line(s); need >= {minimum}"
                )
    return failures


def precheck_advisories() -> list[str]:
    """Thin-or-absent `advisory_docs`, each with its configured hint.

    Never blocks. These are docs a project bootstraps on first use, so
    requiring them would fail the very first run — but a caller that
    reports only `required_docs` gives a green precheck to a repo that a
    later stage will refuse for a doc precheck never mentioned.
    """
    config = get_config()
    minimum = int(config["min_substantive_lines"])
    advisories: list[str] = []
    for rel, hint in config["advisory_docs"].items():
        n = substantive_lines(REPO_ROOT / rel)
        if n < minimum:
            advisories.append(f"  {rel}: {n} substantive line(s) — {hint}")
    return advisories
