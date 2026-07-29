# TypeScript Configuration Package Instructions

This package contains the shared TypeScript configuration for the workspace.

Also follow:

- `/AGENTS.md`
- `/packages/AGENTS.md`

## Do not modify this package

Never modify anything in this package. This includes compiler options, `include`/`exclude`
patterns, path aliases, added or removed configuration files, and the package's exports.

Never work around it from a consuming workspace either:

- Do not override shared compiler options in an application or package `tsconfig.json`.
- Do not add `// @ts-nocheck`, `// @ts-expect-error`, or `any` to silence an error that
  the shared configuration is correctly reporting.
- Do not add path aliases that bypass workspace package exports.

## When a type error appears

Fix the code, not the configuration.

If a type error genuinely cannot be fixed in the code because the shared configuration is
wrong, stop and report it. Describe the error, the file, and why the configuration appears
to be at fault, and let a human decide. Do not change the configuration yourself.

## Changes requested by a human

Only make a change here when a human explicitly asks for that specific change to this
package. In that case:

1. Make the narrowest change that satisfies the request.
2. Change nothing else.
3. Run type checks and builds across every consuming workspace.
4. Report what changed and what ran.
