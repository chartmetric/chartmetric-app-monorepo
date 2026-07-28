# TypeScript Configuration Package Instructions

This package contains shared TypeScript configuration for the workspace.

Also follow:

- `/AGENTS.md`
- `/packages/AGENTS.md`

## Responsibility

Provide stable, reusable TypeScript configuration for applications and packages.

This package must not contain runtime application code.

## Configuration strategy

Prefer a small hierarchy of configurations with clear purposes.

Examples:

```text
base.json
node.json
react.json
library.json
```

Do not create many nearly identical configurations.

Shared defaults belong here.

Application-specific file includes, environment libraries, and build behavior belong in the consuming application when they are not genuinely shared.

## Type safety

Preserve strict TypeScript behavior.

Do not disable strictness repository-wide to resolve a local error.

Avoid weakening options such as:

```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  }
}
```

Prefer correcting the affected code or applying the narrowest justified exception.

## Package boundaries

Do not add TypeScript path aliases that bypass workspace package exports.

Avoid aliases that let applications import another package’s private source files.

Workspace packages should be consumed through their package names and declared exports.

Environment-specific configuration

Browser and Node environments require different libraries and types.

Do not add DOM globals to every workspace merely because the web application needs them.

Do not add Node globals to every frontend package unless they are genuinely required by tooling.

## Build behavior

Be deliberate about:

noEmit.
Declaration generation.
Source maps.
Composite projects.
Incremental compilation.
Module resolution.
JSX configuration.
Target runtime.

Shared libraries and deployable applications may require different settings.

## Configuration changes

Before changing a shared compiler option:

Identify all consumers.
Understand the effect on Vite, Node, tests, and package builds.
Avoid changing unrelated options.
Run type checks and builds across the workspace.
Document behavior that is not self-explanatory.

## Validation

Before completing changes:

Run all available type-checking commands.
Build both applications.
Build or type-check shared packages.
Confirm editor type resolution remains correct.
Confirm package imports resolve through declared workspace boundaries.

---

## Expected tree afterward

```text
.
├── AGENTS.md
├── apps
│   ├── AGENTS.md
│   ├── api
│   │   └── AGENTS.md
│   └── web
│       └── AGENTS.md
└── packages
    ├── AGENTS.md
    ├── eslint-config
    │   └── AGENTS.md
    ├── typescript-config
    │   └── AGENTS.md
    └── ui
        └── AGENTS.md
```