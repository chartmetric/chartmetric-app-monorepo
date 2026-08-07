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

CI, Dependabot, and Railway supply the same token from their own secret stores (`FONTAWESOME_NPM_AUTH_TOKEN`); on Railway each service's `RAILPACK_INSTALL_CMD` writes it to `~/.npmrc` before a `--filter`-scoped install (`api` is filtered out of the FontAwesome subtree and carries no token).

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
ln -s AGENTS.md CLAUDE.md
```

`.claude` exposes the shared skills to Claude Code; `CLAUDE.md` makes it load the repo instructions in `AGENTS.md`. Both symlinks are gitignored (per-machine, only relevant to Claude Code users) and must be created from the repo root — their targets resolve relative to the link's location. Windows (PowerShell, requires Developer Mode): `New-Item -ItemType SymbolicLink -Path .claude -Target .agents` and `New-Item -ItemType SymbolicLink -Path CLAUDE.md -Target AGENTS.md`. Other agent tools can read `.agents/` and `AGENTS.md` directly or use their own pointer convention.

Registry skills are managed with the [`skills` CLI](https://github.com/vercel-labs/skills) and pinned in `skills-lock.json` — never edit those skill directories or the lock by hand. Skills without a lock entry (e.g. `comment-discipline`, `enhanced-message-context`) are repo-authored or repo-customized: edit them in place, and never reinstall them from the registry, which would overwrite the customizations.

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

## AI development harness

Multi-step work can be driven phase by phase through an in-repo harness vendored from [`chartmetric/harness-template`](https://github.com/chartmetric/harness-template). One command writes, verifies, gates, reviews, and locally commits a phase; pushing stays human.

```sh
python3 scripts/execute.py doctor      # environment check — run this first
python3 scripts/execute.py status      # list phases
python3 scripts/execute.py run <id>    # execute one phase end to end
python3 -m unittest discover tests     # the harness's own tests
```

Read [`docs/HARNESS_GUIDE.md`](docs/HARNESS_GUIDE.md) before using it, starting with the system-overview diagram. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) holds the invariants every phase must preserve — the review stage treats a `CRITICAL` / `MUST NOT` violation as blocking. Decisions land in [`docs/ADR.md`](docs/ADR.md).

The harness needs Python 3.10+ (stdlib only, no third-party packages) and the `.claude` / `CLAUDE.md` symlinks from the section above — spawned agents read repo instructions through them, and `doctor` fails if either is missing or broken. CI runs the harness tests on 3.10, the oldest version we claim to support.

A `dangerous_cmd_guard` hook (wired in `.agents/settings.json`) denies destructive shell commands in every Claude Code session in this repo, harness run or not.

## Quality gates

- **Pre-commit** (husky + lint-staged): ESLint `--fix` and Prettier run on staged files, then typecheck and tests. Auto-fixes are re-staged into the commit.
- **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat: ...`, `fix(api): ...`), enforced by commitlint on the `commit-msg` hook.
- **CI** (GitHub Actions): harness tests, format check, lint, typecheck, test, and build on every PR and push to `main`, with pnpm + turbo caching. Railway waits for CI before deploying.
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
