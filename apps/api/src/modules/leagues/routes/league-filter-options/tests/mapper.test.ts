import { describe, expect, it } from "vitest";

import { toLeagueFilterOptions } from "../mapper.ts";

describe("toLeagueFilterOptions", () => {
  it("collates the distinct sports and drops the blanks", () => {
    const options = toLeagueFilterOptions([
      { sport: "tennis" },
      { sport: "football" },
      { sport: "tennis" },
      { sport: "" },
      { sport: null },
      { sport: "basketball" },
    ]);

    expect(options).toEqual({
      sports: ["basketball", "football", "tennis"],
    });
  });

  it("returns an empty list for an empty catalog", () => {
    expect(toLeagueFilterOptions([])).toEqual({ sports: [] });
  });
});
