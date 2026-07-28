# Access and Feature-Gating Architecture

## Status

Approved architecture direction.

This document defines how product availability, permissions, routes, navigation, and vertical identity work across the multi-vertical platform.

The goal is to avoid maintaining duplicate lists of features across vertical configuration, AccessContext, frontend navigation, frontend routes, backend authorization, and Stripe plan mappings.

A feature should not need to be declared in multiple central registries merely to exist.

## 1. Core principle

The platform separates four concerns:

1. **Code defines what exists.**
2. **AuthService defines what the current user/account may access.**
3. **Vertical configuration defines product identity and presentation.**
4. **The API enforces permissions.**

The frontend may use permissions to shape the interface, but frontend checks are never the security boundary.

## 2. Responsibilities

### Application code

Application code defines routes, screens, components, API operations, feature behavior, and optional permission requirements for restricted behavior.

A normal feature does not require a new central feature flag.

Examples that usually require no new permission:

- A new chart.
- A new table column.
- A redesigned page.
- A new filter.
- Improved search.
- A new public section.
- A new saved-view interaction.

### AuthService

AuthService resolves:

```text
PropelAuth identity and role
+
Stripe entitlements
+
seat assignments
+
approved overrides
=
products and resolved permissions
```

It returns permissions, not plan names.

Product code should not need to understand that Enterprise includes exports, Pro Plus includes advanced analytics, or an account has a temporary override. It should only ask whether the account has a stable permission such as `exports.create`.

### Vertical configuration

Vertical configuration defines only product identity and presentation:

- Product ID.
- Hostnames.
- Product name.
- Logo and favicon.
- Mantine theme inputs.
- Entity terminology.

It does not contain feature inventories, route inventories, user entitlements, Stripe plan mappings, account-specific access, or paid-feature flags.

### API

The API is the final authorization boundary. Every restricted operation checks the required permission from trusted server-side AccessContext.

### Frontend

The frontend may hide unavailable navigation, disable restricted actions, show upgrade messaging, and protect routes from confusing navigation. It must not be the only place access is enforced.

## 3. Minimal VerticalConfig

```ts
export type VerticalConfig = {
  id: "sports" | "music";

  hostnames: string[];

  branding: {
    productName: string;
    shortName: string;
    logoPath: string;
    faviconPath?: string;
  };

  theme: {
    primaryColor: string;
  };

  terminology: {
    primaryEntitySingular: string;
    primaryEntityPlural: string;
    secondaryEntitySingular?: string;
    secondaryEntityPlural?: string;
  };
};
```

Example:

```ts
export const sportsConfig = {
  id: "sports",
  hostnames: ["sports.brand.com"],
  branding: {
    productName: "Chartmetric Sports",
    shortName: "Sports",
    logoPath: "/verticals/sports/logo.svg",
  },
  theme: {
    primaryColor: "sportsBrand",
  },
  terminology: {
    primaryEntitySingular: "Athlete",
    primaryEntityPlural: "Athletes",
    secondaryEntitySingular: "Team",
    secondaryEntityPlural: "Teams",
  },
} satisfies VerticalConfig;
```

No feature list is included.

## 4. Minimal AccessContext

```ts
export type AccessContextV1 = {
  schemaVersion: 1;

  user: {
    id: string;
  };

  account: {
    id: string;
    role: string;
  };

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
  "account": { "id": "sony", "role": "analyst" },
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

Permissions represent durable commercial or security boundaries. They do not inventory every route, screen, component, or ordinary feature.

## 5. When a permission is needed

A permission is appropriate when access differs by product subscription, paid entitlement, organization role, administrative authority, seat assignment, security sensitivity, explicit override, or developer API scope.

Examples:

```text
exports.create
advanced_analytics.read
organization.members.manage
billing.manage
developer_api.use
campaigns.manage
```

A new permission is usually not needed for a chart redesign, table column, filter, search improvement, new page section, loading-state improvement, shared UI component, or ordinary bug fix.

Permissions should remain relatively stable even when Stripe packaging changes.

## 6. Route and feature implementation

A restricted route may declare the permission it requires:

```ts
const routes = [
  {
    path: "/athletes",
    element: <AthletesPage />,
  },
  {
    path: "/exports",
    element: <ExportsPage />,
    requiredPermission: "exports.create",
  },
];
```

This is not a second product-feature catalog. It is the route implementation declaring its own access requirement.

The same metadata may drive route guards and navigation visibility:

```ts
const visibleRoutes = routes.filter(
  (route) =>
    !route.requiredPermission || can(route.requiredPermission),
);
```

Ordinary unrestricted routes do not need permission metadata.

## 7. Frontend behavior

The hostname determines product identity:

```ts
const vertical = resolveVerticalConfig(window.location.hostname);
```

AuthService determines user/account access:

```ts
const access = useAccessContext();
```

Product availability:

```ts
const hasProduct = access.products.includes(vertical.id);
```

Restricted action:

```ts
const canExport = access.permissions.includes("exports.create");
```

The frontend check improves user experience only. The API must independently enforce the same permission.

## 8. API enforcement

```ts
fastify.post("/app/exports", async (request) => {
  requireProduct(request.accessContext, "sports");
  requirePermission(request.accessContext, "exports.create");
  return exportService.create(request);
});
```

Shared helpers should deny missing products and permissions, produce the standard API error shape, avoid exposing sensitive policy details, and be covered by authorization tests.

## 9. Stripe and plan mapping

Stripe plan and entitlement mapping lives inside AuthService or its access-data layer.

```text
Stripe Enterprise subscription
        ↓
AuthService mapping
        ↓
exports.create
advanced_analytics.read
developer_api.use
```

If plan packaging changes later, product code remains unchanged because it continues checking stable permissions.

Product code must not contain:

```ts
if (stripePlan === "enterprise") {
  allow();
}
```

## 10. Source-of-truth model

| Question | Canonical source |
|---|---|
| Does a route or feature exist? | Application code |
| What permission does a restricted operation require? | Route/API implementation |
| Which products and permissions does this account have? | AuthService AccessContext |
| How do Stripe plans map to permissions? | AuthService access policy |
| What product is selected by this hostname? | Vertical config |
| What branding and terminology does it use? | Vertical config |
| Is access actually allowed? | API authorization check |
| What should the frontend display? | Route/component code filtered by AccessContext |

There is no central manually maintained inventory of all application features.

## 11. Anti-patterns

Do not duplicate feature availability in vertical config.

Do not return plan names and interpret them throughout products.

Do not place account-specific access in vertical config.

Do not require a permission for every ordinary UI feature.

Do not create separate route, navigation, and feature manifests containing the same information.

Do not rely solely on frontend guards or hidden buttons.

## 12. Adding a normal feature

1. Implement the route, screen, component, or endpoint.
2. Add tests.
3. Add no new permission unless access must vary by account, plan, role, or security boundary.
4. Make no VerticalConfig change unless branding or terminology truly changes.

## 13. Adding a restricted feature

1. Choose one stable permission name.
2. Add its mapping in AuthService.
3. Declare it at the API operation.
4. Enforce it server-side.
5. Optionally use it for frontend visibility or route gating.
6. Add allowed and denied tests.
7. Do not add the feature to VerticalConfig.

## 14. Adding a vertical

1. Add hostname mapping.
2. Add branding and theme inputs.
3. Add terminology.
4. Configure deployment domains.
5. Implement product routes and screens in application code as needed.
6. Map product access in AuthService.
7. Do not maintain a central feature inventory for that vertical.

## 15. Invariants

1. Code defines features.
2. AuthService defines resolved access.
3. VerticalConfig defines identity and presentation only.
4. Permissions represent durable access boundaries, not every UI feature.
5. Stripe plan names never leak into product authorization logic.
6. The API is the final authorization boundary.
7. Frontend gating is a user-experience layer.
8. Normal feature development does not require editing central access contracts.
9. A feature or route declares a permission only when restricted.
10. No duplicated vertical capability catalog is maintained.
