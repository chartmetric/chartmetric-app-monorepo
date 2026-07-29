# Application Instructions

These instructions apply to every deployable application under `apps/`.

Also follow `/AGENTS.md` and the closest app-specific `AGENTS.md`.

## Application boundaries

Each directory under `apps/` is independently deployable and owns its own build, dependencies, and configuration.

- Do not import internal files from another application.
- Code needed by more than one application moves to a package under `packages/`.
- Do not reach into another application's `node_modules`, build output, or environment.

An application may depend on workspace packages through their declared exports.

## Shared code

Before adding a shared abstraction, confirm it is genuinely needed by more than one application. A helper used by one app stays in that app.

Presentational components belong in `packages/ui`. Tooling configuration belongs in the configuration packages.

## Configuration and environment

Each application reads its own environment variables and validates them at startup rather than at point of use.

- Do not read another application's variables.
- Do not place server-only values in frontend-visible configuration.
- Document new required variables in the application's README or example env file.

## Access and feature architecture

Follow `/docs/architecture/access-and-feature-gating.md`.

The API is the final authorization boundary. Frontend gating is a user-experience layer only.

## Completion checklist

- No cross-application imports were introduced.
- Shared code lives in a package, not copied between apps.
- New environment variables are validated and documented.
- Relevant tests, lint, type checks, and production build pass for the changed application.
