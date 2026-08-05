import { describe, expect, it } from "vitest";

import { toArtistFilterOptions } from "../mapper.ts";

describe("toArtistFilterOptions", () => {
  it("sorts by count descending, then value", () => {
    const reply = toArtistFilterOptions(
      [
        { code2: "KR", count: "5" },
        { code2: "BR", count: "12" },
        { code2: "US", count: "12" },
      ],
      [
        { count: "3", tag_slug: "rock" },
        { count: "9", tag_slug: "pop" },
      ],
      [{ max_followers: "404690279" }],
      [{ max_followers: "129100000" }],
    );

    expect(reply).toEqual({
      countries: [
        { count: 12, value: "BR" },
        { count: 12, value: "US" },
        { count: 5, value: "KR" },
      ],
      genres: [
        { count: 9, value: "pop" },
        { count: 3, value: "rock" },
      ],
      instagramFollowers: { max: 404_690_279, min: 0 },
      tiktokFollowers: { max: 129_100_000, min: 0 },
    });
  });

  it("returns empty lists and null bounds untouched", () => {
    expect(toArtistFilterOptions([], [], [], [])).toEqual({
      countries: [],
      genres: [],
      instagramFollowers: { max: null, min: 0 },
      tiktokFollowers: { max: null, min: 0 },
    });
  });
});
