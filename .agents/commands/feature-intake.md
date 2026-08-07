---
description: Turn a plain-language feature ask into an ADR-grounded technical PRD, before /harness proposes phases
disable-model-invocation: true
---

# /feature-intake — PRD enrichment & ADR gap check

This is the step before `/harness`, for anyone describing a feature
without full architectural context — a PM, a designer, an engineer new
to this codebase. It takes a plain-language ask, grounds it in what
this repo has actually already decided, and refuses to let a new
architectural decision get made by default: when no decision exists,
it stops and asks the human, instead of picking for them.

## What to do when this command runs

1. **Get the ask.** If `$ARGUMENTS` is non-empty, treat it as the
   feature description. Otherwise ask the user to describe what they
   want in their own words — no engineering detail expected of them.

2. **Read for context, in full, before translating anything:**
   - `docs/ARCHITECTURE.md`, plus everything it links under
     `docs/architecture/` and `docs/contracts/`.
   - `docs/ADR.md`, every entry.
   - The `## Learned rules` section of `AGENTS.md`.

3. **Translate the ask into concrete technical surface.** Which
   apps/packages it touches, which routes/queries/schemas/permissions
   change, whether it needs a new library, external service, data
   store, queue, or auth pattern. Use search tools to confirm the
   current shape of the code — do not guess.

4. **Cross-check that surface against `docs/ADR.md` and the
   `CRITICAL`/`MUST NOT` invariants in `ARCHITECTURE.md`**, piece by
   piece:
   - **Already decided** — cite the ADR number and fold its constraint
     directly into the PRD (e.g. "queries go through hypequery, per
     ADR-002").
   - **Conflicts with an existing decision** — stop. Explain the
     conflict to the user in plain terms and ask whether to adjust the
     ask or supersede the decision. A superseding decision is a new
     ADR entry that says what it supersedes; `docs/ADR.md` is
     append-only, never edit or delete a past entry.
   - **No decision exists for this surface** — stop. Ask the user to
     choose, with a small set of concrete options and their real
     consequences, in plain language. Do not choose for them and do
     not proceed past this point until they do.

5. **Draft any new or superseding ADR entry** in the exact format used
   in `docs/ADR.md` (Date / Status / Context / Decision /
   Consequences, numbered `ADR-NNN` continuing the existing sequence).
   Show the draft to the user and get explicit confirmation before
   appending it — architecture docs are filled collaboratively here,
   never invented autonomously.

6. **Write or update `docs/PRD.md`:**
   - Create it if it doesn't exist.
   - One `##` section per feature, containing: `Ask` (the plain-
     language input, verbatim), `Goal`, `Requirements` (the technical
     translation from step 3), `Referenced ADRs` (numbers plus a
     one-line reason each), `Out of scope`, `Open questions`.
   - Show the draft to the user before writing it.

7. **Hand off.** Tell the user the next step is `/harness`, which
   reads `docs/PRD.md` and `docs/ARCHITECTURE.md` to propose phases.

## Rules

- Never write to `docs/ADR.md` or `docs/PRD.md` without the user
  confirming the content first.
- Never invent an architectural decision to fill a gap — ask.
- `docs/ADR.md` is append-only: a changed decision is a new entry that
  says it supersedes the old one, never an edit to a past entry.
- This command does not create phases or touch `phases/` — that is
  `/harness`'s job.
- Do not invoke `/harness` (or any other slash command) from inside
  this command's execution — slash commands recurse. Tell the user to
  run it themselves.
