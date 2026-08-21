import { describe, expect, it } from "vitest";

import type { LeagueListQuery, LeagueSortBy } from "../api/types";

import { changeQuerySort } from "./sort-state";

const QUERY: LeagueListQuery = {
  limit: 25,
  offset: 0,
  sortBy: "name",
  sortDirection: "asc",
};

// Pins the first-click direction of every LeagueSortBy member so this set
// cannot drift from the API's ASCENDING_FIRST resolution (list-leagues
// queries.ts) without a failing test.
const FIRST_CLICK_DIRECTIONS: Record<LeagueSortBy, "asc" | "desc"> = {
  igReach: "desc",
  name: "asc",
  sport: "asc",
  trackedAthletes: "desc",
};

describe("changeQuerySort", () => {
  it.each(Object.entries(FIRST_CLICK_DIRECTIONS))(
    "first click on %s sorts %s",
    (sortBy, direction) => {
      const from: LeagueListQuery = {
        ...QUERY,
        sortBy: sortBy === "name" ? "sport" : "name",
      };

      const next = changeQuerySort(from, sortBy as LeagueSortBy);

      expect(next.sortBy).toBe(sortBy);
      expect(next.sortDirection).toBe(direction);
      expect(next.offset).toBe(0);
    },
  );

  it("second click on the same column flips the direction", () => {
    const first = changeQuerySort(QUERY, "igReach");
    const second = changeQuerySort(first, "igReach");

    expect(first.sortDirection).toBe("desc");
    expect(second.sortDirection).toBe("asc");
  });
});
