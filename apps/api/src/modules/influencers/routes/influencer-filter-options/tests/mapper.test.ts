import { describe, expect, it } from "vitest";

import { toInfluencerFilterOptions } from "../mapper.ts";

describe("toInfluencerFilterOptions", () => {
  it("orders categorical vocabularies by descending count and drops empties", () => {
    const result = toInfluencerFilterOptions(
      [
        { count: "10", value: "Music" },
        { count: "10", value: "Gaming" },
        { count: "3", value: "Beauty & Cosmetics" },
        { count: "99", value: "" },
      ],
      [
        { count: "20", value: "US" },
        { count: "5", value: "BR" },
        { count: "7", value: "" },
      ],
      [
        { count: "8", value: "female" },
        { count: "4", value: "male" },
        { count: "1", value: "" },
      ],
      [{ count: "5", value: "25-34" }],
    );

    expect(result.categories).toEqual([
      { count: 10, value: "Gaming" },
      { count: 10, value: "Music" },
      { count: 3, value: "Beauty & Cosmetics" },
    ]);
    expect(result.countries).toEqual([
      { count: 20, value: "US" },
      { count: 5, value: "BR" },
    ]);
    expect(result.genders).toEqual([
      { count: 8, value: "female" },
      { count: 4, value: "male" },
    ]);
  });

  it("returns exactly the six supported age buckets, defaulting absent ones to zero", () => {
    const { ageGroups } = toInfluencerFilterOptions(
      [],
      [],
      [],
      [
        { count: "71206", value: "25-34" },
        { count: "864", value: "65+" },
      ],
    );

    expect(ageGroups).toEqual([
      { count: 0, value: "18-" },
      { count: 0, value: "18-24" },
      { count: 71_206, value: "25-34" },
      { count: 0, value: "35-44" },
      { count: 0, value: "45-64" },
      { count: 864, value: "65+" },
    ]);
  });
});
