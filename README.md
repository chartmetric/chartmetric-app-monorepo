# Chartmetric App Monorepo

A [Turborepo](https://turborepo.dev) + [pnpm](https://pnpm.io) workspace containing the Chartmetric web app and API, plus shared internal packages.

The web app is a [React](https://reactjs.org/) application built with [Vite](https://vite.dev/).
The API is a [Fastify](https://www.fastify.io/) application.

## Setup

**Prerequisites:** Node 26 (see `.nvmrc`) and pnpm 11.

```sh
nvm install   # reads .nvmrc → Node 26
nvm use
corepack enable   # or: npm i -g pnpm@11 — the repo pins pnpm 11 via packageManager
pnpm install
```

## Common commands

Run from the repo root:

```sh
pnpm dev      # start all apps in dev mode
pnpm build    # build all apps and packages
pnpm lint     # lint all workspaces
pnpm format   # format with Prettier
```

To target a single workspace, use a turbo filter, e.g. `pnpm build --filter=api` or `pnpm dev --filter=web`.

## Apps

| App        | Description                                             | Stack            |
| ---------- | ------------------------------------------------------- | ---------------- |
| `apps/web` | Frontend web app                                        | React 19, Vite 8 |
| `apps/api` | HTTP API | Fastify 5        |

## Packages

| Package                   | Description                                                                   |
| ------------------------- | ----------------------------------------------------------------------------- |
| `@repo/ui`                | Shared React component library                                                |
| `@repo/eslint-config`     | Strict shared ESLint flat configs for apps |
| `@repo/typescript-config` | Strict shared `tsconfig.json` bases for apps and packages                                                  |

Everything is 100% [TypeScript](https://www.typescriptlang.org/).
