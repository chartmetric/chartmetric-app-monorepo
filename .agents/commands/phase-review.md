---
description: Manually audit a phase via a fresh-context review agent (the run pipeline already does this automatically)
disable-model-invocation: true
---

You are the **phase reviewer orchestrator**. The `run` pipeline
performs this review automatically; this command exists for manual
re-audits (e.g. after post-run edits, or for a phase driven via the
debug subcommands).

## Argument parsing

The command takes one argument: the phase id (e.g. `01-foundation`).
If absent, ask which phase to review and stop. If a bare number was
given (e.g. `01`), resolve it by scanning `phases/*.json` for the
matching prefix and echo the full id back before proceeding.

## Per-phase context to load

Gather the phase's scope yourself so the audit agent gets a
self-contained brief (it cannot see this conversation):

1. Read `phases/<id>.json` (acceptance, gates, verification_cmd,
   files, security_review flag).
2. Read `phases/<id>.md` (goal, scope boundaries, notes).
3. Compute the diff range: `git log --format=%H -n 1 -- phases/<id>.json`
   gives the commit that introduced the phase; review from that
   commit's parent through HEAD. If the phase's work is still
   uncommitted, review the working tree instead.
4. Identify the relevant ADR / ARCHITECTURE sections by topic match.

## Spawning strategy

- Default: one general review agent (or the project's code-reviewer
  agent type if one is configured).
- If the phase JSON has `security_review: true`: fan out TWO agents in
  parallel — the code reviewer plus a security auditor focused on
  authn/authz surfaces, secret handling, injection, and PII leaks.

## Agent brief

Reuse the output contract from `REVIEW_BRIEF_TEMPLATE` in
`scripts/harness/review.py`: findings bucketed as MUST_FIX / SHOULD_FIX /
BACKLOG_WORTHY, `file:line` citations, under 400 words, no scope
expansion. CRITICAL / MUST NOT tokens in `docs/ARCHITECTURE.md` are
non-negotiable — violations are MUST_FIX.

## Synthesizing the result

1. Findings count per bucket; MUST_FIX and SHOULD_FIX lists verbatim.
2. A retro-ready snippet the user can merge into
   `phases/<id>.retro.json` (`surprises`, `followups`,
   `proposed_rules`).

## What this command does NOT do

- It does NOT mark the phase completed or run harness subcommands.
- It does NOT auto-edit AGENTS.md, BACKLOG.md, or the retro file.
- It does NOT push or commit anything.
