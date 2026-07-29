# ESLint Configuration Package Instructions

This package contains the shared ESLint configuration for the workspace.

Also follow:

- `/AGENTS.md`
- `/packages/AGENTS.md`

## Do not modify this package

Never modify anything in this package. This includes rules, severities, plugins, parser
options, `files`/`ignores` patterns, added or removed configuration files, and the
package's exports.

Never work around it from a consuming workspace either:

- Do not add or edit a local ESLint config to relax a shared rule.
- Do not add `eslint-disable`, `eslint-disable-next-line`, or `eslint-disable` file
  headers to silence a rule that is correctly reporting a problem.
- Do not delete or rename code to avoid a rule instead of fixing what it flags.

## When a lint error appears

Fix the code, not the configuration.

If a rule genuinely should not apply, stop and report it. Describe the rule, the file, and
why the rule appears wrong for this case, and let a human decide. Do not disable the rule
yourself.

## Changes requested by a human

Only make a change here when a human explicitly asks for that specific change to this
package. In that case:

1. Make the narrowest change that satisfies the request.
2. Change nothing else.
3. Run linting across every consuming workspace.
4. Report what changed and what ran.
