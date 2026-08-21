import {
  Badge,
  Button,
  createTheme,
  type CSSVariablesResolver,
  Input,
  type MantineThemeOverride,
  mergeThemeOverrides,
  Table,
  Text,
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
  black: "#17171c",
  colors: {
    blue,
    brandgreen,
    chillyellow,
    grayedteal,
    green,
    orange,
    red,
    teal,
    // Near-black, teal-tinged dark scale (prototype parity): body resolves to
    // dark.7 and cards to dark.6, so those two carry the depth; 0-3 keep
    // Mantine's readable text tones.
    dark: [
      "#C9CDCE",
      "#A8ADAF",
      "#8F9598",
      "#5B6467",
      "#2A3235",
      "#1C2326",
      "#131A1C",
      "#0D1214",
      "#090D0F",
      "#05080A",
    ],
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
      // Buttons are controls, not emphasis: regular weight everywhere.
      styles: { root: { fontWeight: 400 } },
      vars: (_theme, props) => ({
        root:
          props.size === "xs"
            ? {
                // 26px controls with 11px labels: the reference's filter-pill
                // density, and the only height at which a full pill row fits a
                // laptop-width header line.
                "--button-bd": "1px solid var(--mantine-color-default-border)",
                "--button-fz": "var(--mantine-font-size-xs)",
                "--button-height": "1.625rem",
                "--button-padding-x": "0.625rem",
              }
            : {},
      }),
    }),
    Text: Text.extend({
      styles: (_theme, props) =>
        props.ff === "monospace"
          ? // Space Mono's letterforms are wide; tightened tracking keeps the
            // data face from reading a size larger than it is.
            { root: { letterSpacing: "-0.02em" } }
          : { root: {} },
    }),
    Badge: Badge.extend({
      styles: (_theme, props) =>
        props.ff === "monospace"
          ? { root: { letterSpacing: "-0.02em" } }
          : { root: {} },
    }),
    Table: Table.extend({
      vars: () => ({
        table: {
          // Whisper-thin dividers: rows separate by rhythm, not by line weight.
          "--table-border-color":
            "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))",
        },
      }),
    }),
    Input: Input.extend({
      defaultProps: { size: "xs" },
      vars: (_theme, props) => ({
        wrapper:
          props.size === "xs"
            ? {
                // Inputs share header rows with 26px buttons; heights match.
                "--input-bd": "var(--mantine-color-default-border)",
                "--input-fz": "var(--mantine-font-size-sm)",
                "--input-height": "1.625rem",
              }
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
  // One notch below Mantine's defaults across the board (prototype parity):
  // the product's reference density reads xs=11px data text and a ~20px page
  // title. Skeleton bar heights follow automatically — they are CSS-var
  // formulas over these tokens by design-language rule.
  fontSizes: {
    lg: "0.8125rem",
    md: "0.75rem",
    sm: "0.6875rem",
    xl: "0.9375rem",
    xs: "0.625rem",
  },
  // The reference's data text is 12px on a 16px line (1.333); Mantine's 1.55
  // default makes the same rows read taller than they are.
  lineHeights: {
    lg: "1.5",
    md: "1.45",
    sm: "1.4",
    xl: "1.55",
    xs: "1.334",
  },
  headings: {
    fontWeight: "600",
    sizes: {
      h1: { fontSize: "1.25rem", fontWeight: "700", lineHeight: "1.3" },
      h2: { fontSize: "1.125rem", lineHeight: "1.3" },
      h3: { fontSize: "1rem", lineHeight: "1.3" },
      h4: { fontSize: "0.875rem", lineHeight: "1.3" },
      h5: { fontSize: "0.8125rem", lineHeight: "1.3" },
      h6: { fontSize: "0.75rem", lineHeight: "1.3" },
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

/*
 * Control and chip borders sit two steps lighter than Mantine's default
 * (gray-4): the reference's edges are definite but never wiry. Passed to
 * MantineProvider alongside the theme.
 */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  dark: {
    "--mantine-color-default-border": "var(--mantine-color-dark-5)",
  },
  light: {
    "--mantine-color-default-border": "var(--mantine-color-gray-2)",
  },
  variables: {},
});
