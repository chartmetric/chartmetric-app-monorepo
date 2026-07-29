# Web Application Instructions

This directory contains the authenticated React and Vite SPA.

Also follow `/AGENTS.md`, `/apps/AGENTS.md`, and `/docs/architecture/access-and-feature-gating.md`.

## Target architecture

- React with Vite.
- Static client-rendered SPA.
- Mantine.
- TanStack Query.
- OpenAPI-generated API client.

## VerticalConfig

VerticalConfig may define only product ID, hostnames, product name, logo/favicon, Mantine theme inputs, and entity terminology.

Do not add feature lists, capability lists, route inventories, duplicate navigation inventories, user permissions, Stripe plans, or account-specific access.

Feature existence belongs in application code. Access belongs in AuthService.

## Features and routes

Application code defines which routes and screens exist.

Ordinary features require no permission declaration.

A route or action declares a permission only when access differs by plan, entitlement, role, seat, security boundary, override, or API scope.

```ts
{
  path: "/exports",
  element: <ExportsPage />,
  requiredPermission: "exports.create",
}
```

Use the same route metadata for navigation visibility where practical. Do not maintain duplicate route and navigation catalogs.

## AccessContext

The frontend consumes resolved products and permissions from AuthService.

Preferred:

```ts
can("exports.create")
```

Forbidden:

```ts
plan === "enterprise"
```

The frontend may hide navigation, disable actions, display upgrade messaging, and protect routes from confusing navigation. It is not the security boundary. Every protected operation must also be enforced by the API.

## Components

Use Mantine before custom primitives. Components should have typed props, semantic HTML, keyboard support, accessible labels, and loading/empty/error/success states.

Generic presentational components belong in `packages/ui`. Application-specific components stay here.

## TanStack Query

Use TanStack Query for remote server state. Do not mirror query results into another global store.

Query keys include every value that changes returned data, including account ID for account-scoped data.

## API access

Use the generated OpenAPI client once available.

Do not import Fastify internals, import Drizzle schemas into UI code, duplicate server response types, access databases directly, or place server credentials in frontend code.

## Completion checklist

- No duplicate feature or permission catalog was introduced.
- VerticalConfig remains presentation-only.
- Restricted actions use stable permissions.
- Account-scoped query keys include account ID.
- API contracts are not duplicated.
- Relevant tests and production build pass.
