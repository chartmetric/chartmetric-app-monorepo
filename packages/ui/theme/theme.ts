import {
  Button,
  createTheme,
  Input,
  type MantineThemeOverride,
  mergeThemeOverrides,
  Tooltip,
} from "@mantine/core";

import {
  blue,
  brandgreen,
  chillyellow,
  grayedteal,
  green,
  orange,
  red,
  teal,
} from "./colors";

export const baseTheme = createTheme({
  autoContrast: true,
  black: "#0b1215",
  colors: {
    blue,
    brandgreen,
    chillyellow,
    grayedteal,
    green,
    orange,
    red,
    teal,
  },
  /*
   * Controls default one step down from Mantine's `sm`, taking buttons and
   * inputs from 36px to 30px tall with proportionally tighter padding. Filter
   * chips and toolbars are the densest surfaces in the product, and at the
   * default size a filter bar wraps onto a third row that a compact one fits
   * on two.
   *
   * Button and Input move together on purpose: they share a row in FilterBar
   * under `align="flex-end"`, so a height difference between them shows up as
   * misaligned top edges. Both are 30px at `xs`. ActionIcon is deliberately
   * left alone — its default `md` is already 28px, so shrinking the others
   * brings it into line rather than out of it.
   */
  components: {
    /*
     * `xs` also drops the label to 12px, which is too small to scan in a row
     * of filter chips, so the font size is pinned back to `sm` (14px) while
     * the box stays compact. Applied only at `xs` — a caller who asks for a
     * larger button still gets that size's own type scale.
     */
    Button: Button.extend({
      defaultProps: { size: "xs" },
      vars: (_theme, props) => ({
        root:
          props.size === "xs"
            ? { "--button-fz": "var(--mantine-font-size-sm)" }
            : {},
      }),
    }),
    Input: Input.extend({
      defaultProps: { size: "xs" },
      vars: (_theme, props) => ({
        wrapper:
          props.size === "xs"
            ? { "--input-fz": "var(--mantine-font-size-sm)" }
            : {},
      }),
    }),
    /*
     * Mantine's tooltip inverts the scheme — dark surface in light mode, light
     * surface in dark mode — which reads as chrome borrowed from another
     * product. Pinning the surface to the body color keeps a floating panel a
     * sibling of the page it explains, so it needs its own border and shadow to
     * separate from what sits behind it.
     *
     * `focus` is off in Mantine's default event set, which leaves every tooltip
     * unreachable by keyboard; it belongs on every floating surface, not on the
     * call sites that remember to ask.
     */
    Tooltip: Tooltip.extend({
      defaultProps: {
        events: { focus: true, hover: true, touch: false },
      },
      styles: {
        tooltip: {
          border: "1px solid var(--mantine-color-default-border)",
          boxShadow: "var(--mantine-shadow-md)",
        },
      },
      vars: () => ({
        tooltip: {
          "--tooltip-bg": "var(--mantine-color-body)",
          "--tooltip-color": "var(--mantine-color-text)",
        },
      }),
    }),
  },
  fontFamily:
    "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  // The data face: every numeric cell, count, and metric value renders in it so
  // digits line up down a column. Loaded by the consuming app (see main.tsx).
  fontFamilyMonospace: "'Space Mono', ui-monospace, Menlo, monospace",
  headings: {
    fontWeight: "600",
    sizes: {
      h1: { fontSize: "1.75rem", fontWeight: "700", lineHeight: "1.3" },
      h2: { fontSize: "1.6rem", lineHeight: "1.3" },
      h3: { fontSize: "1.4rem", lineHeight: "1.3" },
      h4: { fontSize: "1.25rem", lineHeight: "1.3" },
      h5: { fontSize: "1.125rem", lineHeight: "1.3" },
      h6: { fontSize: "1rem", lineHeight: "1.3" },
    },
  },
  primaryColor: "teal",
  // Square-leaning, tracking the prototype's 0.3rem base at `md`. Round corners
  // read as consumer-app softness; the reference tables want drawn edges.
  radius: {
    xs: "0.125rem",
    sm: "0.1875rem",
    md: "0.3rem",
    lg: "0.375rem",
    xl: "0.5rem",
  },
  // Roughly 25% tighter than Mantine's default scale (10/12/16/20/32px). The
  // product is data-dense — ranked tables, filter bars, stat rows — so the
  // default padding pushes too few rows above the fold.
  spacing: {
    xs: "0.375rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
  },
});

export const createVerticalTheme = (
  overrides: MantineThemeOverride,
): MantineThemeOverride => mergeThemeOverrides(baseTheme, overrides);
