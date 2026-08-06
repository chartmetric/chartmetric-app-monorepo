import { describe, expect, it } from "vitest";

import { toNumber } from "../numbers.ts";

describe("toNumber", () => {
  it("reads a 64-bit column whether it arrives quoted or numeric", () => {
    expect(toNumber("404690279")).toBe(404_690_279);
    expect(toNumber(404_690_279)).toBe(404_690_279);
    expect(toNumber("-12345")).toBe(-12_345);
  });

  it("preserves a genuine zero", () => {
    expect(toNumber(0)).toBe(0);
    expect(toNumber("0")).toBe(0);
  });

  it("treats absent and empty values as no value", () => {
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber("")).toBeNull();
  });

  it("treats unparseable input as no value rather than NaN", () => {
    expect(toNumber("not-a-number")).toBeNull();
    expect(toNumber(NaN)).toBeNull();
    expect(toNumber(Infinity)).toBeNull();
  });
});
