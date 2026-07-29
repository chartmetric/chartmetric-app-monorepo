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

Follow the stack already in use in the app you are touching. Do not introduce an additional framework, state manager, component library, styling system, or data-access path when an existing one already covers the need; propose the change first.

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

Before finishing:

1. Run relevant formatting, linting, type checks, tests, and builds.
2. Regenerate derived artifacts.
3. Review the diff.
4. Check for secrets and temporary files.
5. Report exactly what changed and what ran.

Never claim a check passed unless it actually ran successfully.

## Validation

Local pre-commit hooks run:

- ESLint and Prettier on staged files.
- Repository type checking.
- Repository tests.

Pull-request CI runs:

- Prettier verification.
- Linting.
- Tests.
- Production builds, which also run type checking through Turborepo.

Before completing a task, run the checks relevant to the changed packages.
Do not claim a check passed unless it was actually run.

Generated-artifact no-diff validation must be added when the repository
first commits generated contracts, clients, SDKs, or documentation. Do not
introduce placeholder generation infrastructure before then.

## Documentation

Update architecture documentation only when architecture, ownership, or policy changes.

Do not duplicate live feature catalogs, permission catalogs, API shapes, or route inventories in Markdown.

Prefer code and generated artifacts as operational sources of truth.
