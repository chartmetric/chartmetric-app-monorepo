import type { MantineSpacing } from "@mantine/core";

/*
 * The density of a table and of the chrome rows above and below it. Exported
 * because several modules must resolve to the same numbers: the toolbar and
 * footer a page composes around a table, and the skeleton that stands in for
 * all three. Any disagreement is a layout shift the moment data arrives.
 */
export const TABLE_VERTICAL_SPACING: MantineSpacing = "sm";
export const TABLE_TOOLBAR_PADDING = { px: "md", py: 4 } as const;
export const TABLE_FOOTER_PADDING = { px: "md", py: "xs" } as const;

export const TOOLTIP_WIDTH = 240;
// An overflow affordance summarizes; past this many entries a tooltip stops
// listing and states how many more exist (design rule: never enumerate).
export const TOOLTIP_ITEM_LIMIT = 10;

// Mantine's default event set omits focus, which leaves tooltip content
// unreachable by keyboard. The shared theme sets the same default, but a
// shared component cannot depend on the consumer's theme for keyboard access.
export const TOOLTIP_EVENTS = { focus: true, hover: true, touch: false };

// Light-mode hovers stay gray (design rule); dark keeps the accent wash. Set
// on the Paper wrapper that owns a table, never on DataTable itself.
export const ROW_HOVER_STYLE = {
  "--table-highlight-on-hover-color":
    "light-dark(var(--mantine-color-gray-1),var(--mantine-color-teal-light))",
} as const;
