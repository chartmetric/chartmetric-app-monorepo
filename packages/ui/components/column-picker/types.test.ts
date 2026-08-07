import { describe, expect, it } from "vitest";

import { isSamePreset, moveKey } from "./types";

describe("isSamePreset", () => {
  it("matches the same columns in the same order", () => {
    expect(isSamePreset(["a", "b", "c"], ["a", "b", "c"])).toBe(true);
  });

  // Reordering is what the configure modal is for, so applying a preset whose
  // order differs would visibly rearrange the table.
  it("does not match the same columns in a different order", () => {
    expect(isSamePreset(["a", "b"], ["b", "a"])).toBe(false);
  });

  it("does not match a repeated column against two distinct ones", () => {
    expect(isSamePreset(["a", "b"], ["a", "a"])).toBe(false);
  });

  it("does not match different lengths", () => {
    expect(isSamePreset(["a"], ["a", "b"])).toBe(false);
    expect(isSamePreset(["a", "b"], ["a"])).toBe(false);
  });

  it("treats two empty selections as the same", () => {
    expect(isSamePreset([], [])).toBe(true);
  });
});

describe("moveKey", () => {
  it("moves a column later", () => {
    expect(moveKey(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("moves a column earlier", () => {
    expect(moveKey(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("leaves the order alone when the positions match", () => {
    expect(moveKey(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the array it was given", () => {
    const keys = ["a", "b", "c"];

    moveKey(keys, 0, 2);

    expect(keys).toEqual(["a", "b", "c"]);
  });

  // Splice would otherwise silently drop or duplicate a column.
  it("returns the same columns when an index is out of range", () => {
    expect(moveKey(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });
});
