---
name: api-endpoint-workflow
description: Create or change typed Fastify endpoints in the Chartmetric API through a mandatory product/data preflight, ClickHouse schema discovery, response-schema generation, route-level surface registration, TDD contract tests, OpenAPI/client generation, and final validation. Use whenever adding, changing, moving, or reviewing an endpoint, route plugin, API response mapper, module query, or `/app` versus `/v1` exposure under apps/api.
---

# API Endpoint Workflow

Follow the canonical human workflow in `apps/api/README.md#adding-or-changing-an-endpoint` and the policies in `apps/api/AGENTS.md`. Treat every gate below as blocking.

## 0. Settle the surface before anything else

Surface is the one preflight decision that is never safe to infer, because both defaults are wrong in a way the code cannot detect. Put the route on `/v1` when it should have been internal and you have published a contract to external developers that they may build against and you cannot quietly withdraw. Leave it off `/v1` when it should have been public and the feature silently never ships to the developer API.

Ask the user, in their words, not in ours:

> **Should this be a public developer API endpoint?** Answering yes puts it under `/v1`, in the published `/docs`, and in `openapi.json` for external API-key customers. Answering no keeps it under `/app` only, hidden from the docs, for the Chartmetric web app.

Rules:

- Ask this question even when the task says nothing about surfaces. Silence is not an answer, and `/app` is not a safe default.
- Ask it with the user-input tool (e.g. `AskUserQuestion`) when one is available, as a standalone question with the three options: app only, v1 only, both.
- Ask it again when **changing** an existing route — moving a route between surfaces is a publishing decision, not a refactor, and it changes `openapi.generated.json` and the shipped client.
- Skip it only when the user has already answered it explicitly in this task. A related endpoint's surface, a module's other routes, and "it's like artists" are not answers; surface is per route, not per module.
- Never resolve it yourself, even under time pressure or in an autonomous run. Stop and ask.

Record the answer verbatim in the `access` decision of the contract test, naming the authentication each chosen surface implies (`/app` session, `/v1` developer API key and scopes).

## 1. Complete the rest of the preflight

Do not edit endpoint code until the task or user has resolved:

- Surface: `/app`, `/v1`, or both — settled in gate 0 above.
- Method, path, request schema, response shape, pagination, sorting, and errors.
- Source tables, selected columns, row filters, and null normalization.
- Product, permission, API-scope, and authentication requirements.

Reuse answers already present in the task and ask only unresolved questions. Ask no more than three related questions at a time. If a user-input tool is available, use it. Never infer an ambiguous surface or authorization boundary.

Before asking the user to choose ClickHouse data, run:

```sh
pnpm --filter api endpoint:inspect
pnpm --filter api endpoint:inspect -- --table <table>
```

Use `--live` when the committed snapshot does not contain the required table. Show table and column names, types, and comments. Do not sample rows unless the user explicitly asks; then follow the `clickhouse-best-practices` discovery and query-safety rules.

## 2. Establish the red test

For a new route, run `pnpm --filter api create:endpoint` after the preflight is approved. In a non-interactive agent session, inspect `pnpm --filter api create:endpoint -- --help`, pass every required flag and `--confirm`, and add `--live` when the table is absent from the snapshot. Never use `--confirm` before the user has approved the displayed decisions.

Repeat `--table <name> --columns <csv>` for multiple ClickHouse sources. Use `--table none --columns none` only when the approved endpoint does not read ClickHouse.

Run the generated contract test and verify that it fails because the route is not registered. For an existing route, update its contract or behavior assertions first and verify the expected failure before implementation.

Changing a route's surfaces is a contract change, so update the same set every time: `surfaces` and the `access` decision in `<route>.contract.test.ts`, the surface-specific assertions in the module `routes.test.ts`, the `/v1` path list in `src/tests/app.test.ts`, and the tag description in `src/plugins/openapi.ts` when a module reaches the public docs for the first time. Then regenerate, because a new `/v1` path changes `openapi.generated.json` and the frontend client.

Do not proceed when the test fails for an unrelated setup or compilation error.

## 3. Implement the endpoint

Follow this order:

1. Add the module query in `src/modules/<module>/queries.ts`.
2. Run `pnpm --filter api generate:ch-schema` after introducing a table or changed column.
3. Run `pnpm --filter api typecheck` before response generation and fix every source error.
4. Add a mapper and a top-level `export const PascalCaseName = defineApiResponse(mapper)` marker.
5. Run `pnpm --filter api generate` unless root `pnpm dev` is watching.
6. Add one route per `src/modules/<module>/routes/<route>.ts` with explicit request and response schemas.
7. Register it through `createApiRoutes()` in the module `routes.ts` with the approved surfaces.
8. Mount a new module from both surface plugins; route-level surface filtering decides actual exposure.

Keep raw database types inside the module. Select only necessary columns and normalize the public shape in the mapper. Do not edit generated files.

TypeScript does not retain an optional object-property narrowing inside a
deferred query-builder callback. Capture the narrowed property in a local
constant before the callback:

```ts
if (query.name !== undefined) {
  const name = query.name;
  builder = builder.where((predicate) => predicate.fn("example", predicate.value(name)));
}
```

## 4. Reach green

Make the targeted contract test pass. Add route-specific tests for validation, response values, expected errors, and allowed and denied authorization where applicable. Then run:

```sh
pnpm --filter api check:endpoints
pnpm generate:api-client
pnpm check:generated
pnpm --filter api typecheck
pnpm --filter api lint
pnpm --filter api test
```

Do not claim readiness until every applicable check succeeds. Report the expected red failure, the final green targeted test, all validation commands actually run, and generated artifacts changed.
