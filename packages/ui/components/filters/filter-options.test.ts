import { describe, expect, it } from "vitest";

import { toCountedFilterOptions, toFilterOptions } from "./MultiSelectFilter";

describe("toFilterOptions", () => {
  it("labels each value with itself", () => {
    expect(toFilterOptions(["Serie A", "La Liga"])).toEqual([
      { label: "Serie A", value: "Serie A" },
      { label: "La Liga", value: "La Liga" },
    ]);
  });

  it("returns nothing for no values", () => {
    expect(toFilterOptions([])).toEqual([]);
  });
});

describe("toCountedFilterOptions", () => {
  it("describes each option with its formatted count", () => {
    expect(
      toCountedFilterOptions(
        [
          { count: 1234, value: "Argentina" },
          { count: 7, value: "Chile" },
        ],
        (count) => count.toLocaleString("en-US"),
      ),
    ).toEqual([
      { description: "1,234", label: "Argentina", value: "Argentina" },
      { description: "7", label: "Chile", value: "Chile" },
    ]);
  });

  // The caller owns formatting so the package needs no locale of its own.
  it("uses the caller's formatter verbatim", () => {
    expect(
      toCountedFilterOptions([{ count: 5, value: "Tennis" }], () => "five"),
    ).toEqual([{ description: "five", label: "Tennis", value: "Tennis" }]);
  });
});
