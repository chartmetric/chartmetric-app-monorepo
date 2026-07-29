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

import { Button } from "@chartmetric/ui";

Avoid:

import { Button } from "@chartmetric/ui/src/components/Button";

Keep package internals private unless they are intentionally part of the supported API.

Changing an exported type or function can affect multiple applications. Treat public export changes deliberately.

## Package design

A shared package should:

Have a focused purpose.
Declare its own dependencies.
Avoid hidden reliance on application environment variables.
Avoid side effects during import.
Expose typed APIs.
Include tests for important logic.
Build independently where appropriate.
Internal dependencies

Use workspace dependency declarations such as:
```ts
{
  "dependencies": {
    "@chartmetric/ui": "workspace:*"
  }
}
```

Do not use relative paths to reach another package’s source directory.

## Configuration packages

Configuration packages affect many workspaces.

Changes to ESLint or TypeScript configuration should be validated across all consuming applications and packages.

Do not weaken global checks simply to resolve one local issue.

## Completion checklist

Before completing package work:

The package responsibility remains focused.
Public exports are intentional.
No application code is imported.
No circular dependency was introduced.
All consumers still type-check and build.
Relevant documentation is updated.