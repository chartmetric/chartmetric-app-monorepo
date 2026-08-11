import {
  createTheme,
  type MantineThemeOverride,
  mergeThemeOverrides,
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
  fontFamily:
    "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
  radius: {
    xs: "0.25rem",
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
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
