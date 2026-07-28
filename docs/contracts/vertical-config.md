# Vertical Configuration Contract

## Purpose

`VerticalConfig` identifies the active product from the hostname and supplies presentation-level differences.

It does not describe every feature available in the vertical and does not grant user access.

## Canonical logical shape

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

## What belongs here

- Product ID.
- Production and approved preview hostnames.
- Product display name.
- Logo and favicon.
- Mantine theme inputs.
- Entity terminology.

## What does not belong here

- Feature inventories.
- Route inventories.
- Navigation inventories that duplicate route code.
- User permissions.
- Product entitlements.
- Stripe plan mappings.
- Account-specific access.
- Secrets or credentials.

Feature existence belongs in application code. Access belongs in AuthService.

## Hostname resolution

Resolve the vertical once during application startup.

```ts
const vertical = resolveVerticalConfig({
  hostname: window.location.hostname,
});
```

Unknown production hostnames fail safely. Local development may use a validated override such as `VITE_VERTICAL_ID`. Components consume the resolved config rather than repeatedly inspecting hostname.

Hostname selection is not authorization.

## Feature and access behavior

Application code defines which routes and screens exist.

A restricted route may declare a required permission:

```ts
{
  path: "/exports",
  element: <ExportsPage />,
  requiredPermission: "exports.create",
}
```

AuthService determines whether the current account has that permission. VerticalConfig does not repeat this fact.

## Source of truth

| Question | Canonical source |
|---|---|
| Which product does this hostname represent? | VerticalConfig registry |
| What branding and terminology does it use? | VerticalConfig |
| Does a feature exist? | Application code |
| Is a user allowed to use it? | AuthService AccessContext |
| Is access enforced? | API authorization |

## Adding a vertical

1. Add hostname mapping.
2. Add branding and theme inputs.
3. Add terminology.
4. Configure deployment domains.
5. Add product routes and screens in application code as required.
6. Map product access in AuthService.
7. Do not create a feature inventory in VerticalConfig.

## Related architecture

See `/docs/architecture/access-and-feature-gating.md`.
