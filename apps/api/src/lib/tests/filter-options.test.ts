import { describe, expect, it } from "vitest";

import {
  compareNames,
  countValues,
  sortedKeys,
  toSortedRecord,
} from "../filter-options.ts";

describe("countValues", () => {
  it("orders the most common value first", () => {
    expect(countValues(["a", "b", "a"])).toEqual([
      { count: 2, value: "a" },
      { count: 1, value: "b" },
    ]);
  });

  it("breaks a tie alphabetically", () => {
    expect(
      countValues(["Tennis", "Football"]).map(({ value }) => value),
    ).toEqual(["Football", "Tennis"]);
  });

  it("drops absent and empty values instead of counting them", () => {
    expect(countValues(["a", "", null, undefined, "a"])).toEqual([
      { count: 2, value: "a" },
    ]);
  });

  it("returns nothing for no values", () => {
    expect(countValues([])).toEqual([]);
  });
});

describe("compareNames", () => {
  it("sorts accented names where a reader expects them", () => {
    expect(["Zurich", "Örebro", "Beşiktaş"].toSorted(compareNames)).toEqual([
      "Beşiktaş",
      "Örebro",
      "Zurich",
    ]);
  });

  it("does not depend on the default locale", () => {
    expect(compareNames("a", "b")).toBe("a".localeCompare("b", "en"));
  });
});

describe("toSortedRecord", () => {
  it("sorts both the keys and the values under them", () => {
    const groups = new Map<string, Set<string>>([
      ["tennis", new Set(["WTA", "ATP"])],
      ["football", new Set(["Serie A", "La Liga"])],
    ]);

    expect(toSortedRecord(groups)).toEqual({
      football: ["La Liga", "Serie A"],
      tennis: ["ATP", "WTA"],
    });
    expect(Object.keys(toSortedRecord(groups))).toEqual(["football", "tennis"]);
  });

  it("returns nothing for no groups", () => {
    expect(toSortedRecord(new Map())).toEqual({});
  });
});

describe("sortedKeys", () => {
  it("orders the keys by name", () => {
    expect(
      sortedKeys(
        new Map([
          ["tennis", 1],
          ["basketball", 2],
          ["football", 3],
        ]),
      ),
    ).toEqual(["basketball", "football", "tennis"]);
  });
});
