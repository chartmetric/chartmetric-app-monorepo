# API Application Instructions

This directory contains the persistent Fastify backend.

Also follow `/AGENTS.md`, `/apps/AGENTS.md`, `/docs/architecture/access-and-feature-gating.md`, and `/docs/contracts/access-context.md`.

## API surfaces

- `/app/*`: first-party user/session authentication.
- `/v1/*`: developer API-key authentication, scopes, rate limits, and usage.

Do not mix their authentication assumptions.

## Route rules

Every public route defines request schemas, response schemas, authentication, authorization where required, and expected errors.

## Access model

AuthService returns enabled products and stable resolved permissions.

The API must not interpret Stripe plan names.

Preferred:

```ts
requireProduct(request.accessContext, "sports");
requirePermission(request.accessContext, "exports.create");
```

Forbidden:

```ts
if (stripePlan === "enterprise") {
  allow();
}
```

## Permission creation

Do not create a permission for every endpoint or ordinary feature.

Create one only when access differs by commercial entitlement, organization role, seat, administrative authority, security sensitivity, explicit override, or developer API scope.

Normal charts, filters, fields, and UI improvements usually require no new permission.

## Enforcement

The API is the final authorization boundary. Frontend hiding, disabling, or route guards never replace server checks.

Protected operations require allowed and denied tests.

## OpenAPI

Fastify route schemas are the public contract source. Generated clients and specs are never edited manually.

hypequery-generated schemas must be incorporated into one unified published specification rather than creating a competing source of truth.

## Data boundaries

Use Drizzle for PostgreSQL and governed hypequery definitions for ClickHouse. Do not return raw database rows as API contracts or execute arbitrary ClickHouse SQL from feature routes.

## Completion checklist

- No Stripe plan logic leaked into product routes.
- No unnecessary permission was introduced.
- Required permissions are server-enforced.
- Request and response schemas are explicit.
- Data boundaries are preserved.
- OpenAPI artifacts are regenerated.
- Relevant tests, lint, types, and builds pass.
