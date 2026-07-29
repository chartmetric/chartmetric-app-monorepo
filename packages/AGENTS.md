# Shared Package Instructions

These instructions apply to packages under `packages/`.

Also follow the repository-root `AGENTS.md` and the closest package-specific `AGENTS.md`.

## Purpose

Packages contain reusable code, stable contracts, and shared tooling.

A package should have a clear responsibility that can be described in one sentence.

Do not create a package solely to hold miscellaneous helpers.

## Dependency direction

Packages must not import from applications.

Packages may depend on other packages when the dependency direction is clear and does not create a cycle.

Prefer lower-level packages that do not depend on application-specific concepts.

## Public API

Consumers should import from declared package exports.

Preferred:

```ts
import { Button } from "@chartmetric/ui";
```

Avoid:

```ts
import { Button } from "@chartmetric/ui/src/components/Button";
```

Keep package internals private unless they are intentionally part of the supported API.

Changing an exported type or function can affect multiple applications. Treat public export changes deliberately.

## Package design

A shared package should:

- Have a focused purpose.
- Declare its own dependencies.
- Avoid hidden reliance on application environment variables.
- Avoid side effects during import.
- Expose typed APIs.
- Include tests for important logic.
- Build independently where appropriate.

## Internal dependencies

Use workspace dependency declarations such as:

```json
{
  "dependencies": {
    "@chartmetric/ui": "workspace:*"
  }
}
```

Do not use relative paths to reach another package’s source directory.

## Configuration packages

Never modify `packages/eslint-config` or `packages/typescript-config`, and never work around them locally with disable comments, `@ts-nocheck`, `any`, or overriding config in a consuming workspace.

When lint or type checking fails, fix the code. If the configuration itself appears wrong, stop and report it rather than changing it. See each package's `AGENTS.md`.

## Completion checklist

Before completing package work:

- The package responsibility remains focused.
- Public exports are intentional.
- No application code is imported.
- No circular dependency was introduced.
- No shared ESLint or TypeScript configuration was modified or worked around.
- All consumers still type-check and build.
- Relevant documentation is updated.
