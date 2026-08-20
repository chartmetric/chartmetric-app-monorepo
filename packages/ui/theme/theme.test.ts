import { describe, expect, it } from "vitest";

import { baseTheme, createVerticalTheme } from "./theme";

type ScaleKey = "xs" | "sm" | "md" | "lg" | "xl";

const SCALE_KEYS: ScaleKey[] = ["xs", "sm", "md", "lg", "xl"];

/** Mantine 9's own defaults (10/12/16/20/32px), as rem numbers. */
const MANTINE_DEFAULT_SPACING: Record<ScaleKey, number> = {
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
const remValue = (key: ScaleKey): number => {
  const raw = baseTheme.spacing?.[key];

  expect(raw, `spacing.${key} is defined`).toMatch(/^[\d.]+rem$/);

  return Number(raw?.replace("rem", ""));
};

describe("baseTheme", () => {
  it("uses teal as the primary color", () => {
    expect(baseTheme.primaryColor).toBe("teal");
    expect(baseTheme.colors?.teal?.[5]).toBe("#00b6c7");
  });

  it("scales every font size one notch below Mantine's defaults", () => {
    expect(baseTheme.fontSizes).toEqual({
      lg: "0.8rem",
      md: "0.7rem",
      sm: "0.65rem",
      xl: "0.9rem",
      xs: "0.6rem",
    });
  });

  it("darkens the dark scale so the body sits near-black", () => {
    expect(baseTheme.colors?.dark?.[7]).toBe("#0D1214");
  });

  it("names Space Mono first in the data face", () => {
    expect(baseTheme.fontFamilyMonospace).toMatch(/^'Space Mono',/u);
  });

  it("keeps the radius scale square-leaning and strictly increasing", () => {
    const steps = SCALE_KEYS.map((key) => {
      const raw = baseTheme.radius?.[key];

      expect(raw, `radius.${key} is defined`).toMatch(/^[\d.]+rem$/);

      return Number(String(raw).replace("rem", ""));
    });

    expect(steps).toEqual([0.125, 0.1875, 0.3, 0.375, 0.5]);
    expect(steps).toEqual([...steps].toSorted((a, b) => a - b));
  });

  it("opens tooltips on focus so they are reachable by keyboard", () => {
    expect(baseTheme.components?.["Tooltip"]?.defaultProps).toMatchObject({
      events: { focus: true, hover: true },
    });
  });

  it("tightens every spacing step below the Mantine default", () => {
    for (const key of SCALE_KEYS) {
      expect(
        remValue(key),
        `spacing.${key} is tighter than the Mantine default`,
      ).toBeLessThan(MANTINE_DEFAULT_SPACING[key]);
    }
  });

  it("keeps the spacing scale strictly increasing", () => {
    const steps = SCALE_KEYS.map((key) => remValue(key));

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
