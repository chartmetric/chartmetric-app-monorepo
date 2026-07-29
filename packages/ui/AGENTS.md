# Shared UI Package Instructions

This package contains shared presentational UI components.

Also follow:

- `/AGENTS.md`
- `/packages/AGENTS.md`

## Responsibility

The UI package should contain reusable, brand-aware, presentational components built on Mantine.

It should not own:

- API requests.
- TanStack Query hooks.
- Authentication.
- Authorization decisions.
- Application routing.
- Vertical selection.
- Product-specific business logic.
- Database types.

Use a props-in, events-out design.

## Component design

Shared components should:

- Have explicit TypeScript props.
- Use Mantine primitives where possible.
- Use semantic theme tokens.
- Support keyboard interaction.
- Include accessible labels and states.
- Avoid assumptions about one product vertical.
- Avoid reading global application state directly.
- Avoid accessing environment variables.

Preferred:

```tsx
<EntityHeader
  name={artist.name}
  imageUrl={artist.imageUrl}
  entityLabel={vertical.labels.primaryEntity}
  onFollow={handleFollow}
/>
```

Avoid:
```ts
<EntityHeader artistId={artistId} />
```

when that causes the shared component to fetch data or depend on application-specific services.

## Vertical neutrality

Do not hard-code vertical-specific entity names when the component can receive the label or entity description through props.

Do not hard-code vertical colors, logos, or hostnames.

Use Mantine theme values and caller-provided configuration.

## Styling

Use Mantine APIs and theme values.

Do not add:

Tailwind.
CSS-in-JS libraries that duplicate Mantine.
A second design-token system.
Hard-coded vertical brand palettes throughout components.

Local CSS modules may be used when Mantine styling APIs are insufficient, but keep them scoped and explain unusually complex styling.

## State

Shared UI components may own local interaction state when it is intrinsic to the component.

Examples:

Whether a popover is open.
Which accordion item is expanded.
Temporary input state.

They should not own shared server state or application-wide business state.

## Exports

Expose supported components through the package entry point.

Do not require consumers to import from internal paths.

Keep internal helpers unexported unless they are intentionally reusable.


## Testing

Important shared components should test:

Basic rendering.
User interaction.
Disabled and loading behavior.
Accessibility-relevant behavior.
Relevant edge cases.

Avoid snapshot-only tests as the sole validation of behavior.

## Completion checklist

Before completing UI-package work:

The component is genuinely reusable.
It is presentational.
It does not fetch product data.
It does not enforce authorization.
It uses Mantine and semantic theme values.
It is not hard-coded to one vertical.
Its public export is intentional.
Relevant tests and consuming builds pass.