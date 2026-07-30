import { describe, expect, it } from "vitest";

import { baseTheme, createVerticalTheme } from "./theme";

describe("baseTheme", () => {
  it("uses teal as the primary color", () => {
    expect(baseTheme.primaryColor).toBe("teal");
    expect(baseTheme.colors?.teal?.[5]).toBe("#00b6c7");
  });

  it("keeps Mantine defaults for spacing and font sizes", () => {
    expect(baseTheme.spacing).toBeUndefined();
    expect(baseTheme.fontSizes).toBeUndefined();
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
