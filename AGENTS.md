# Chartmetric Multi-Vertical Monorepo

## Purpose

This repository contains a multi-vertical Chartmetric platform built with React/Vite, Fastify, PostgreSQL/Drizzle, ClickHouse/hypequery, OpenAPI, Turborepo, and pnpm.

The repository is evolving. Inspect the implementation before assuming planned packages or services already exist.

## Instruction precedence

Read this file first, then every applicable nested `AGENTS.md`. More specific instructions override broader instructions.

## Core architecture

- Deployable applications live under `apps/`.
- Shared reusable code lives under `packages/`.
- Applications do not import internal files from other applications.
- Packages do not import from applications.
- Use declared workspace exports.
- Use TypeScript and pnpm.

## Technology choices

Follow the stack already in use in the workspace you are touching. Do not introduce an additional framework, state manager, component library, styling system, or data-access path when an existing one already covers the need; propose the change first.

## Access and feature architecture

Follow `/docs/architecture/access-and-feature-gating.md`.

Rules:

- Code defines which routes and features exist.
- AuthService defines which products and restricted permissions the current user/account has.
- VerticalConfig defines hostname, product identity, branding, theme inputs, and terminology only.
- Do not maintain a central inventory of every application feature.
- Do not duplicate feature availability in VerticalConfig and AccessContext.
- Permissions represent durable commercial or security boundaries, not ordinary UI features.
- Stripe plan names must not appear in product authorization logic.
- The API is the final authorization boundary.
- Frontend gating is for user experience only.

## Security

Never commit or print secrets, modify production data, run production migrations, deploy to production, change Stripe products or entitlements, disable authorization to make tests pass, or trust browser-supplied roles/products/permissions.

## Working method

Before editing:

1. Read applicable `AGENTS.md` files.
2. Inspect nearby code and tests.
3. Read relevant architecture/contracts.
4. Identify generated artifacts.
5. State a brief plan for non-trivial work.

During implementation:

1. Make the smallest complete change.
2. Preserve boundaries.
3. Add or update tests.
4. Avoid unrelated cleanup.
5. Do not silently change public contracts.
6. Do not introduce a permission unless access genuinely differs by plan, role, seat, security boundary, override, or API scope.
7. Write self-documenting code, not comments. Comment only non-obvious constraints, the reason for a surprising approach, formulas, or legal requirements — never narration, change descriptions, or JSDoc that restates a signature. Follow the `comment-discipline` skill.

Before finishing:

1. Run relevant formatting, linting, type checks, tests, and builds.
2. Regenerate derived artifacts.
3. Review the diff.
4. Check for secrets and temporary files.
5. Report exactly what changed and what ran.

Never claim a check passed unless it actually ran successfully.

## Validation

Local pre-commit hooks run ESLint and Prettier on staged files, repository type checking, and repository tests.

Pull-request CI runs Prettier verification, linting, tests, and production builds, which also run type checking through Turborepo.

Before completing a task, run the checks relevant to the changed packages.

Generated-artifact no-diff validation must be added when the repository first commits generated contracts, clients, SDKs, or documentation. Do not introduce placeholder generation infrastructure before then.

## Harness engineering

Multi-step work runs through the in-repo phase harness. Mechanics and the full phase lifecycle live in `docs/HARNESS_GUIDE.md`; the architectural invariants every phase must preserve live in `docs/ARCHITECTURE.md`.

- **Phase lifecycle** — `/harness` proposes phases, then `python3 scripts/execute.py run <id>` executes one end to end (lint → write ⟲ verify → gates → smoke → review ⟲ fix → retro draft → local commit). The human edits the drafted retro, lands worthwhile `proposed_rules` into `## Learned rules` below, then pushes. One phase = one commit = one PR.
- **Portable agent commands** — `/feature-intake` turns a plain-language feature ask (from a PM, designer, or anyone without full architectural context) into a technical `docs/PRD.md` entry, stopping to ask the user whenever the ask touches an architectural surface with no existing ADR or conflicts with one. Run it before `/harness` for any **product feature** ask that didn't already arrive as a technical PRD; repository and tooling work — harness changes, CI, lint rules, dependency work — needs no PRD entry and is governed by `docs/ARCHITECTURE.md` and `docs/ADR.md`. `/harness` advances the harness. `/backlog` triages `docs/BACKLOG.md`, which is otherwise never read. `/harness-review` reviews the current branch against repo conventions. `/phase-review <id>` re-audits a phase with a fresh-context agent.
- **Command dispatch** — when a user's top-level prompt begins with one of those command names, read the corresponding `.agents/commands/<name>.md` file in full and execute it as the workflow for the current turn. Treat the remainder of the prompt as `$ARGUMENTS`; an absent remainder means empty arguments. This dispatch rule applies to every repository-aware agent that reads `AGENTS.md`, whether or not its client provides a native slash-command menu.
- **Do not chain agent commands** — a user starts each command in a separate top-level prompt. While executing a command, do not invoke another command; finish by telling the user which command to run next. Harness-spawned agents must not dispatch these commands.
- **Precheck gates every run.** `docs/ARCHITECTURE.md` must have substantive content; `python3 scripts/execute.py precheck` reports what is missing. It also reports `advisory_docs` — recommended files such as `docs/PRD.md` that are thin or absent — without blocking, so a gap surfaces before a later stage refuses for it rather than after. Architecture and product docs are filled collaboratively with the user, never invented autonomously.
- **Architecture decisions go in `docs/ADR.md` before the phase that depends on them.**
- **Never run harness subcommands from inside a spawned agent.** `HARNESS_PARENT=1` is set on every agent the runner spawns and `execute.py` refuses to run with it set.

The `dangerous_cmd_guard` PreToolUse hook (wired in `.agents/settings.json`) denies destructive shell commands in every session. When it blocks an action: read the reason, fix the underlying cause, and try again. Never retry with `--no-verify`, and never edit the hook script to make a failing rule pass — propose a separate change if the rule itself is wrong.

## Agent skills

Installed skills live in `.agents/skills/` (exposed to Claude Code via the per-machine `.claude` symlink; see the README setup). Each nested `AGENTS.md` lists the skills relevant to its workspace; read the matching skill before working on that technology. Registry-installed skills are managed with `npx skills` and pinned in `skills-lock.json`; do not hand-edit them. Skills with no lock entry (e.g. `comment-discipline`, `enhanced-message-context`) are repo-authored or carry repo-specific customizations: edit them in place and never reinstall them from the registry, which would overwrite the customizations.

Repo-wide skills:

- `turborepo` — task pipelines, caching, `--filter`/`--affected`, internal package boundaries.
- `pnpm` — workspace configuration, catalogs, and dependency management.
- `typescript-advanced-types` — generics, conditional/mapped types, and type-level utilities.
- `comment-discipline` — the repository's no-unnecessary-comments policy; applies to every code change.

## Documentation

Update architecture documentation only when architecture, ownership, or policy changes.

Do not duplicate live feature catalogs, permission catalogs, API shapes, or route inventories in Markdown.

Prefer code and generated artifacts as operational sources of truth.

## Generated files

Packages that generate source code, OpenAPI specs, SDKs, or documentation must expose a `generate` script.

Generated files are never edited manually. Modify the canonical source, run the relevant generator, and commit the generated output.

## Learned rules

Durable rules harvested from phase retrospectives. Each phase's retro proposes candidates in `proposed_rules`; a human lands the ones worth keeping here, and every future writer and reviewer reads them. This section grows over time — that accretion is the point.

Keep entries short, imperative, and specific enough to act on. A rule belongs here when it would have prevented a real failure; general advice belongs in a skill instead.

The first three were harvested from recurring pull-request review comments rather than from a retro — each one had to be raised with an agent by hand more than once.

- **Compose ClickHouse queries with the hypequery builder; never write SQL.** Use `.table()`, `.withCTE()`, `.where()`, and the join helpers. `rawAs<T, "alias">("<expr>", "alias")` is allowed only for a scalar expression inside a chain — an aggregate, a cast, arithmetic — never for a `FROM`, `JOIN`, `WHERE`, or a whole statement. A hand-written query string loses the schema types that make a column rename a compile error instead of a runtime one, and it reintroduces interpolation as an injection path. ESLint blocks both the raw `@clickhouse/client` import and SQL-shaped template literals under `apps/api/src/modules/**`.
- **Derive types from generated artifacts; never restate them.** API request and response types come from `paths` in `@repo/api-client`; ClickHouse row shapes come from `db/clickhouse/schema.generated.ts`; route contracts come from the TypeBox schemas. Narrow with `Pick`, `NonNullable`, and indexed access. Hand-write a type only for something that exists solely in the consumer, such as component props or a UI display mode. A restated type does not fail when the contract changes — it silently disagrees with it.
- **Follow the workspace's own layout; read its nested `AGENTS.md` first.** The concrete folder and base-name conventions live there and override this file. Two rules hold everywhere: code specific to one route or page stays with it and is promoted only when a second consumer actually appears, and every module is named for the responsibility its exports serve — never `utils`, `helpers`, `common`, `shared`, or an abstract noun broad enough to accumulate anything. Both directions are failures: a route handler that also builds queries and maps rows, and a helper hoisted to a shared package on its first use.
- **Search before writing a helper.** Option mapping, collation, formatting, null normalization, and date conversion have all been reimplemented locally when an owner already existed. Look for the semantics, not the name, and extend the existing owner rather than adding a parallel one. Centralize by shared knowledge, not by how generic the code looks: how a sport resolves to a competitive level is a domain question that stays in its module, while counting whole years between two dates knows nothing about the domain and belongs in `lib`.
- **A ClickHouse query is unverified until its SQL has executed.** Stubbed builders and asserted SQL strings prove the builder emits what you expected; they cannot tell you ClickHouse accepts it. Ambiguous identifiers, ambiguous join keys, and `Replacing*` reads missing `FINAL` pass every string assertion and fail against a real schema. Any phase touching a query needs a `smoke_cmd` that runs the matrix.
- **Joining a `Replacing*` table needs a CTE with `FINAL`, and a dedupe key that matches the join key.** A join target cannot carry `FINAL`, so joining the table directly can match a row still awaiting a merge — read it through a CTE that applies `.final()` and join the CTE. And `FINAL` only collapses rows sharing the sorting key: when the join key is not a prefix of the table's sorting key (e.g. `ORDER BY id` joined on `profile_id`), `FINAL` cannot deduplicate for that join — reduce to one row per join key explicitly with `GROUP BY` plus `argMax` over the version column. Check this from the schema, not from data: the defect is invisible while the table happens to hold one row per join key, and becomes live the first time it doesn't.

See `docs/ARCHITECTURE.md` for the full statement of each, including the file-layout diagrams and the canonical type-derivation idiom.
