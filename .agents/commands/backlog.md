---
description: Triage the harness backlog — list active items, ask which to address now
disable-model-invocation: true
---

# /backlog — Triage Backlog

Read `docs/BACKLOG.md`. List active items grouped by priority (P1, P2,
P3). Ask the user which to address now. Do NOT auto-address any item.
Do NOT modify `BACKLOG.md` without explicit user confirmation.

If the user picks one or more items:

1. Confirm scope with the user before any edit.
2. Implement the item with tests, following the repo's test conventions.
3. Move the resolved item from `## Active` to `## Resolved` (keep the
   last 10 resolved entries, drop older ones).
4. Commit with `chore(backlog):` or `feat:` as appropriate.

If the user wants to add a new backlog item rather than triage:

1. Confirm the item text, priority (P1 / P2 / P3), and source.
2. Append under `## Active` in the same format as existing entries.
3. Commit with `docs(backlog): add <short summary>`.
