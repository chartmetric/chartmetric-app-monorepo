import { describe, expect, it } from "vitest";

import { toSportLabel } from "./sport-labels";

describe("toSportLabel", () => {
  it.each([
    ["football", "Football"],
    ["american_football", "American Football"],
    ["Football", "Football"],
    ["table tennis", "Table Tennis"],
    ["ATP", "ATP"],
  ])("renders %s as %s", (raw, expected) => {
    expect(toSportLabel(raw)).toBe(expected);
  });

  it("collapses the separators the warehouse can emit around a word", () => {
    expect(toSportLabel("_american__football_")).toBe("American Football");
  });
});
