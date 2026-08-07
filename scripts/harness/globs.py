"""Segment-aware path glob matching.

Python's fnmatch lets `*` cross `/` (so `src/*.py` matches
`src/deep/nested/evil.py`), which silently narrows scope-creep
detection. This module implements shell-style semantics instead:

    *      any run of characters WITHIN one path segment
    ?      one character within a segment
    **/    zero or more whole segments (leading)
    **     any remainder, crossing segments

Patterns and paths are repo-relative POSIX strings.
"""

from __future__ import annotations

import re

_cache: dict[str, re.Pattern] = {}


def glob_to_regex(pattern: str) -> re.Pattern:
    if pattern in _cache:
        return _cache[pattern]
    out: list[str] = []
    i = 0
    n = len(pattern)
    while i < n:
        c = pattern[i]
        if c == "*":
            if pattern[i : i + 3] == "**/":
                out.append("(?:[^/]+/)*")
                i += 3
            elif pattern[i : i + 2] == "**":
                out.append(".*")
                i += 2
            else:
                out.append("[^/]*")
                i += 1
        elif c == "?":
            out.append("[^/]")
            i += 1
        else:
            out.append(re.escape(c))
            i += 1
    compiled = re.compile("^" + "".join(out) + "$")
    _cache[pattern] = compiled
    return compiled


def path_match(path: str, pattern: str) -> bool:
    return bool(glob_to_regex(pattern).match(path))


def path_match_any(path: str, patterns: list[str]) -> bool:
    return any(path_match(path, p) for p in patterns)
