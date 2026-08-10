---
description: Advance the harness — show status, propose phases, or run the current phase
disable-model-invocation: true
---

You are operating inside this repo's **phase harness**, documented in
`docs/HARNESS_GUIDE.md`. Phases live as JSON + md pairs in `phases/`.
The CLI runner is `scripts/execute.py`. Project knobs live in
`harness.config.json`.

## What to do when this command runs

1. **Run `python3 scripts/execute.py precheck` FIRST.** If it exits
   non-zero, STOP — do not propose phases, do not edit any file, do not
   write placeholder content. Show the precheck output to the user
   verbatim and ask them to fill the required docs with real content.
   The check is programmatic (counts substantive lines excluding
   headers/comments) so you cannot satisfy it by inventing one-liners;
   the user must provide real product / architecture content.
   Precheck may also print **advisories** — recommended docs that are
   thin or absent. These do not block, but surface them to the user
   now rather than discovering the gap several steps later.
2. Run `python3 scripts/execute.py status` to list current phases.
3. If `phases/` is empty AND precheck passed:
   - Propose a phase plan (≤ 10 phases) derived from `docs/ARCHITECTURE.md`
     and, when it covers the feature, `docs/PRD.md`. Each phase should be
     one PR of work with mechanically checkable acceptance criteria.
   - Write each phase as `phases/NN-<slug>.json` (schema in
     `docs/HARNESS_GUIDE.md`) plus `phases/NN-<slug>.md` following
     `phases/PHASE_TEMPLATE.md`. Set `security_review: true` on
     launch/auth/payment/PII phases.
   - Run `python3 scripts/execute.py lint <id>` on each proposed phase
     and fix findings.
   - Ask the user to confirm before proceeding.
4. If a phase is `in_progress`, `exhausted`, or `needs_human`:
   - Show its status, stage, and (if present) `review_findings` /
     backlog entry. Help the user triage; on their confirmation re-run
     `python3 scripts/execute.py run <id>` in the background and report
     the outcome.
5. If the current phase is `pending`:
   - Show its acceptance criteria and ask the user to confirm.
   - On confirm: run `python3 scripts/execute.py run <id>` (long-
     running — run it in the background and monitor). When it
     completes, present the drafted retro for the user to edit, and
     surface any `proposed_rules` worth landing in the `## Learned rules`
     section of AGENTS.md.

## Rules

- The `run` pipeline is the normal path. `start`/`finish`/`review`/
  `retro` subcommands are debug/recovery tools — reach for them only
  when the user asks or a run needs manual repair.
- Do not modify multiple phases at once. Finish current, then advance.
- Never run `git push` or create PRs without explicit user OK.
- Defer architectural choices not covered by `docs/ARCHITECTURE.md` to
  the user — do not silently lock in boundaries, libraries, or schema
  shapes.
- `docs/PRD.md` is an append-only log of feature entries, one `##` per
  feature, created by `/feature-intake` on first use. It is deliberately
  advisory rather than in `required_docs`: requiring it would fail the
  first run of a repo that has no features logged yet.
- For **product feature** work whose ask is not already covered by a
  `docs/PRD.md` entry, tell the user to run `/feature-intake` first
  rather than inventing requirements or architectural decisions
  yourself. Repository and tooling maintenance — harness changes, CI,
  lint rules, dependency work — needs no PRD entry; `docs/ARCHITECTURE.md`
  and `docs/ADR.md` govern it.
