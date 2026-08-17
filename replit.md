# Chartmetric App Monorepo — Replit Setup

Turborepo + pnpm workspace: React 19/Vite 8 frontend (`apps/web`) and Fastify 5 API (`apps/api`).

## How to run

Two workflows are configured — press **Run** or start them from the Workflows panel:

| Workflow           | Command                 | Port           |
| ------------------ | ----------------------- | -------------- |
| **Web (frontend)** | `pnpm --filter web dev` | 5173 (webview) |
| **API (backend)**  | `pnpm --filter api dev` | 8008 (console) |

## Required secrets (Replit Secrets)

| Key                          | Description                                           |
| ---------------------------- | ----------------------------------------------------- |
| `FONTAWESOME_NPM_AUTH_TOKEN` | FontAwesome Pro npm token — needed for `pnpm install` |
| `CLICKHOUSE_HOST`            | ClickHouse host URL                                   |
| `CLICKHOUSE_USER`            | ClickHouse username                                   |
| `CLICKHOUSE_PASSWORD`        | ClickHouse password                                   |
| `AUTHSERVICE_URL`            | Internal auth service URL                             |
| `SESSION_SECRET`             | Session signing secret                                |
| `VITE_PROPELAUTH_AUTH_URL`   | PropelAuth frontend auth URL                          |

## Required env vars (non-secret)

| Key                | Value                    | Description                     |
| ------------------ | ------------------------ | ------------------------------- |
| `PORT`             | `8008`                   | API server port                 |
| `VITE_API_URL`     | `http://localhost:8008`  | API base URL for the frontend   |
| `API_PROXY_TARGET` | `http://127.0.0.1:8008`  | Vite dev proxy target           |
| `CORS_ORIGIN`      | `https://localhost:5173` | CORS allowed origin for the API |

## PropelAuth setup

The frontend uses PropelAuth for auth. For the Replit preview to work, add the Replit dev domain as a frontend location in the PropelAuth **test** project dashboard:

```
https://<your-repl-id>.picard.replit.dev
```

Run `echo "https://$REPLIT_DEV_DOMAIN"` in the shell to get the exact URL.

## Notes

- Node 26 is pinned in the project; Replit provides Node 24. The pnpm engine warning is informational — the project runs fine on 24.
- pnpm v11 passes `--` through literally to underlying commands, so CLI flags for `vite` must go in `vite.config.ts`, not appended to the workflow command.
- `vite.config.ts` sets `allowedHosts: true` and `host: true` so Replit's proxied domain is allowed and the port is detectable by the workflow runner.

## User preferences

- Keep existing project structure (Turborepo monorepo) intact.
- Never use `--no-verify` or any flag that bypasses pre-commit hooks.
