# ESLint Configuration Package Instructions

This package contains shared ESLint configuration for the workspace.

Also follow:

- `/AGENTS.md`
- `/packages/AGENTS.md`

## Responsibility

This package should provide reusable lint configurations for applications and packages.

It must not contain application runtime logic.

## Change impact

Changes here may affect the entire monorepo.

Before modifying a shared rule:

1. Identify every workspace using the configuration.
2. Understand why the current rule is failing.
3. Prefer fixing the local code when the rule is valid.
4. Avoid globally disabling a rule to resolve one isolated case.
5. Run linting across all affected workspaces.

## Rule changes

When adding or changing a rule:

- Prefer official or well-maintained plugins.
- Avoid redundant plugins.
- Confirm compatibility with the installed ESLint version.
- Document non-obvious repository-wide exceptions.
- Use the narrowest practical override.
- Keep frontend, backend, and library environments distinct where necessary.

Avoid broad configuration such as:

Avoid broad configuration such as:

```js
{
  rules: {
    "important-rule": "off"
  }
}
```

when a file-pattern override or local refactor would solve the issue.

## Type-aware linting

If enabling type-aware rules:

Confirm each consuming workspace provides the required TypeScript configuration.
Consider lint performance.
Do not accidentally include build output or generated files.
Ensure editor linting still works.
Generated files

Generated files may be excluded when linting them provides no value.

Do not exclude manually maintained source files merely because they currently contain errors.

## Exports

Keep configuration exports clear and stable.

Examples may include separate configurations for:

Base TypeScript.
React applications.
Node applications.
Shared libraries.

Do not require consumers to import internal implementation paths.

## Validation

Before completing changes:

Run the root lint command.
Verify both apps/api and apps/web.
Verify representative shared packages.
Confirm no new broad disable comments were introduced.
Confirm editor-compatible configuration remains valid.