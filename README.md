# Chartmetric App Monorepo

A [Turborepo](https://turborepo.dev) + [pnpm](https://pnpm.io) workspace containing the Chartmetric web app and API, plus shared internal packages.

The web app is a [React](https://reactjs.org/) application built with [Vite](https://vite.dev/).
The API is a [Fastify](https://www.fastify.io/) application.

## Setup

**Prerequisites:** Node 26 (see `.nvmrc`) and pnpm 11.

```sh
nvm install          # reads .nvmrc → Node 26
nvm use
npm install -g pnpm@11   # Node 26 no longer bundles corepack; the repo pins pnpm via packageManager
pnpm config set "//npm.fontawesome.com/:_authToken" "<token>"   # once per machine — FontAwesome Pro token from the team vault
pnpm install         # also installs the git hooks (husky) via the prepare script
```

**If you use nvm:** git hooks don't load your shell profile, so commits from GUI clients (or a shell on a different Node) can fail with old-Node errors. Fix once per machine by creating `~/.config/husky/init.sh`:

```sh
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
  nvm use --silent >/dev/null 2>&1 || true
fi
```

## AI agent skills (optional)

The repo ships shared agent skills in [`.agents/`](.agents), pinned by `skills-lock.json`. They give AI coding agents project-specific knowledge.

**If you use Claude Code**, point it at the shared directory once per machine, from the repo root:

```sh
ln -s .agents .claude
```

The symlink is gitignored (per-machine, only relevant to Claude Code users) and must be created from the repo root — its target resolves relative to the link's location. Windows: `New-Item -ItemType SymbolicLink -Path .claude -Target .agents` (PowerShell, requires Developer Mode). Other agent tools can read `.agents/` directly or use their own pointer convention.

To manage skills, use the [`skills` CLI](https://github.com/vercel-labs/skills) — never edit `.agents/skills/` or `skills-lock.json` by hand:

```sh
npx skills experimental_install   # restore skills from skills-lock.json (fresh clone)
npx skills add <owner>/<repo>     # add a skill package
npx skills update                 # update to latest upstream versions
npx skills remove <name>          # remove a skill (also updates the lock)
```

## Common commands

Run from the repo root:

```sh
pnpm dev        # start all apps in dev mode
pnpm build      # build all apps and packages (gated on typecheck)
pnpm test       # run all tests (vitest)
pnpm typecheck  # tsc --noEmit in every workspace
pnpm lint       # ESLint (zero warnings allowed)
pnpm format     # format with Prettier
```

To target a single workspace, use a turbo filter, e.g. `pnpm build --filter=api` or `pnpm dev --filter=web`.

## Quality gates

- **Pre-commit** (husky + lint-staged): ESLint `--fix` and Prettier run on staged files, then typecheck and tests. Auto-fixes are re-staged into the commit.
- **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat: ...`, `fix(api): ...`), enforced by commitlint on the `commit-msg` hook.
- **CI** (GitHub Actions): format check, lint, typecheck, test, and build on every PR and push to `main`, with pnpm + turbo caching. Railway waits for CI before deploying.
- **Dependabot**: weekly dependency PRs (minor/patch grouped, 7-day cooldown).

## Apps

| App        | Description      | Stack            |
| ---------- | ---------------- | ---------------- |
| `apps/web` | Frontend web app | React 19, Vite 8 |
| `apps/api` | HTTP API         | Fastify 5        |

## Packages

| Package                   | Description                                                    |
| ------------------------- | -------------------------------------------------------------- |
| `@repo/ui`                | Shared React component library                                 |
| `@repo/eslint-config`     | Strict shared ESLint flat configs (`/base`, `/react`, `/node`) |
| `@repo/typescript-config` | Strict shared `tsconfig.json` bases (base, react, node)        |

Everything is 100% [TypeScript](https://www.typescriptlang.org/).
