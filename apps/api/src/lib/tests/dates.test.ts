import { describe, expect, it } from "vitest";

import { toAge, toDateString } from "../dates.ts";

describe("toDateString", () => {
  it("discards the zero-date sentinel", () => {
    expect(toDateString("0000-00-00")).toBeNull();
  });

  it("keeps a real date", () => {
    expect(toDateString("2026-07-06")).toBe("2026-07-06");
  });

  it("treats empty and absent values as no value", () => {
    expect(toDateString("")).toBeNull();
    expect(toDateString(null)).toBeNull();
    expect(toDateString(undefined)).toBeNull();
  });
});

describe("toAge", () => {
  const today = new Date("2026-08-05T00:00:00Z");

  it("counts whole years", () => {
    expect(toAge("1990-08-05", today)).toBe(36);
  });

  it("does not count a birthday that has not happened yet this year", () => {
    expect(toAge("1990-08-06", today)).toBe(35);
    expect(toAge("1990-12-31", today)).toBe(35);
  });

  it("counts a birthday earlier in the year", () => {
    expect(toAge("1990-01-01", today)).toBe(36);
  });

  it("treats an absent or unparseable date as no value", () => {
    expect(toAge(null, today)).toBeNull();
    expect(toAge("", today)).toBeNull();
    expect(toAge("not-a-date", today)).toBeNull();
  });

  it("rejects implausible ages", () => {
    expect(toAge("2030-01-01", today)).toBeNull();
    expect(toAge("1800-01-01", today)).toBeNull();
  });
});
