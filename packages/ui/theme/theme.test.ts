import { describe, expect, it } from "vitest";

import { baseTheme, createVerticalTheme } from "./theme";

type SpacingKey = "xs" | "sm" | "md" | "lg" | "xl";

const SPACING_KEYS: SpacingKey[] = ["xs", "sm", "md", "lg", "xl"];

/** Mantine 9's own defaults (10/12/16/20/32px), as rem numbers. */
const MANTINE_DEFAULT_SPACING: Record<SpacingKey, number> = {
  xs: 0.625,
  sm: 0.75,
  md: 1,
  lg: 1.25,
  xl: 2,
};

/**
 * Reads a spacing step as a number of rem. Asserting the `rem` unit here is
 * deliberate: a step silently switched to `px` would break the scale's
 * relationship to the root font size, and comparing the bare number would hide
 * that.
 */
const remValue = (key: SpacingKey): number => {
  const raw = baseTheme.spacing?.[key];

  expect(raw, `spacing.${key} is defined`).toMatch(/^[\d.]+rem$/);

  return Number(raw?.replace("rem", ""));
};

describe("baseTheme", () => {
  it("uses teal as the primary color", () => {
    expect(baseTheme.primaryColor).toBe("teal");
    expect(baseTheme.colors?.teal?.[5]).toBe("#00b6c7");
  });

  it("keeps Mantine defaults for font sizes", () => {
    expect(baseTheme.fontSizes).toBeUndefined();
  });

  it("tightens every spacing step below the Mantine default", () => {
    for (const key of SPACING_KEYS) {
      expect(
        remValue(key),
        `spacing.${key} is tighter than the Mantine default`,
      ).toBeLessThan(MANTINE_DEFAULT_SPACING[key]);
    }
  });

  it("keeps the spacing scale strictly increasing", () => {
    const steps = SPACING_KEYS.map((key) => remValue(key));

    expect(steps).toEqual([...steps].toSorted((a, b) => a - b));
    expect(new Set(steps).size).toBe(steps.length);
  });
});

describe("createVerticalTheme", () => {
  it("applies vertical overrides on top of the base theme", () => {
    const vertical = createVerticalTheme({ primaryColor: "blue" });

    expect(vertical.primaryColor).toBe("blue");
    expect(vertical.colors?.teal).toEqual(baseTheme.colors?.teal);
    expect(vertical.autoContrast).toBe(true);
  });
});
