---
description: Review the current branch's changes against repo conventions
disable-model-invocation: true
---

Review the diff between `HEAD` and the base branch (default `main`).
Apply this rubric, in order:

1. **Correctness** — does the change do what its commit message claims?
   Are edge cases (null, empty input, retries, idempotency) handled?
2. **Tests** — changed source files under `apps/*/src/**` or
   `packages/*/src/**` should have a test exercising the new
   behaviour. Flag missing tests, using judgment: type-only modules,
   generated files, and presentational components validated visually
   are not automatic findings.
3. **Convention adherence** — check the `## Learned rules` section of
   AGENTS.md and any CRITICAL / MUST NOT tokens in
   `docs/ARCHITECTURE.md`. Violations of the latter are always
   `block`.
4. **Phase alignment** — does the change stay within the scope of the
   current `phases/*.json`? Out-of-scope work should be a new phase.
5. **Style** — match the conventions in AGENTS.md, including the
   `## Learned rules` section and the `comment-discipline` skill.

Output per finding: `severity (block / nit) — file:line — issue — suggested fix`.
End with a one-line verdict: `ship` or `block`.
