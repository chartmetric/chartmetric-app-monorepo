# AccessContext Contract

## Purpose

`AccessContext` answers:

> Who is this user, which account are they acting under, which products are enabled, and which restricted actions may they perform?

It is not an inventory of every application feature.

AuthService resolves it from PropelAuth identity and role, Stripe entitlements, seat assignments, and approved overrides.

Product code checks stable permissions and does not interpret Stripe plans directly.

## Canonical logical shape

```ts
export type AccessContextV1 = {
  schemaVersion: 1;
  user: { id: string };
  account: { id: string; role: string };
  products: string[];
  permissions: string[];
  issuedAt: string;
  expiresAt: string;
};
```

Example:

```json
{
  "schemaVersion": 1,
  "user": { "id": "user_123" },
  "account": { "id": "account_123", "role": "analyst" },
  "products": ["sports", "chartmetric_flow"],
  "permissions": [
    "exports.create",
    "advanced_analytics.read",
    "campaigns.manage"
  ],
  "issuedAt": "2026-07-28T17:00:00Z",
  "expiresAt": "2026-07-28T17:05:00Z"
}
```

## Field meaning

- `schemaVersion`: identifies structure and semantics. Unsupported versions deny by default.
- `user.id`: stable validated identity-provider user ID.
- `account`: active account, verified server-side.
- `products`: stable IDs for products the account may access. Missing products are disabled.
- `permissions`: stable restricted capabilities. Missing permissions are denied.
- `issuedAt` and `expiresAt`: RFC 3339 UTC timestamps for the short-lived context lifetime.

Permissions do not enumerate every route, screen, component, or ordinary feature.

## Permission design

Create a permission only when access differs by plan, entitlement, organization role, seat, administrative authority, security sensitivity, explicit override, or API scope.

Usually no new permission:

- New chart.
- New table column.
- New filter.
- Redesigned page.
- Search improvement.
- Shared UI component.

Possible new permission:

- Paid export.
- Advanced analytics tier.
- Member administration.
- Billing administration.
- Developer API access.

## Server enforcement

```ts
requireProduct(context, "sports");
requirePermission(context, "exports.create");
```

The API is always the final authorization boundary.

## Frontend usage

The frontend may hide unavailable navigation, disable restricted actions, show upgrade messaging, and avoid predictable forbidden requests. Frontend checks do not provide security.

## Account switching

When the active account changes, the API verifies membership, AuthService resolves a new context, account-scoped frontend queries are invalidated, and account-scoped cache keys use the new account ID.

## Caching

A product backend may cache AccessContext for approximately one to five minutes. Keys include schema version, user ID, and account ID. Cache entries never outlive `expiresAt`, and cache failures never grant access.

## Source of truth

| Concern                    | Canonical source              |
| -------------------------- | ----------------------------- |
| Context schema             | Shared runtime schema in code |
| Product/permission mapping | AuthService access policy     |
| Permission enforcement     | API helpers and route tests   |
| Frontend visibility        | UI code reading AccessContext |
| Stripe plan definitions    | Stripe                        |
| Identity and org role      | PropelAuth                    |

This document states policy and intent. It must not duplicate the live permission catalog.

## Forbidden patterns

Do not interpret Stripe plan names in product code.

Do not infer access from organization names.

Do not trust browser-supplied permissions.

Do not create a permission for every normal feature.

Do not treat hidden frontend UI as authorization.

## Related architecture

See `/docs/architecture/access-and-feature-gating.md`.
