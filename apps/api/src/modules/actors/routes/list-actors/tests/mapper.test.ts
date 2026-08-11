import { describe, expect, it } from "vitest";

import { toActorList } from "../mapper.ts";

describe("toActorList", () => {
  it("normalizes nullable fields, counts, and known-for ordering", () => {
    const result = toActorList(
      [
        {
          id: 7,
          name: "Actor",
          profile_path: "",
          popularity: 91.2,
          instagram_handle: "",
          instagram_url: null,
          instagram_followers: "1234",
          role_count: "3",
          known_for:
            '[[99.1,12,"movie","Lead","Alpha","   "],[88,8,"show","   ","Beta","HBO"]]',
        },
      ],
      42,
      { limit: 10, offset: 20 },
    );

    expect(result).toEqual({
      data: [
        {
          id: 7,
          imageUrl: null,
          instagramFollowers: 1234,
          instagramHandle: null,
          instagramUrl: null,
          knownFor: [
            {
              character: "Lead",
              id: 12,
              kind: "movie",
              name: "Alpha",
              network: null,
              popularity: 99.1,
            },
            {
              character: null,
              id: 8,
              kind: "show",
              name: "Beta",
              network: "HBO",
              popularity: 88,
            },
          ],
          name: "Actor",
          popularity: 91.2,
          roleCount: 3,
        },
      ],
      meta: { limit: 10, offset: 20, total: 42 },
    });
  });

  it("resolves TMDB profile paths to absolute image URLs", () => {
    const [actor] = toActorList(
      [
        {
          id: 7,
          name: "Actor",
          profile_path: "/mDLDvsx8PaZoEThkBdyaG1JxPdf.jpg",
          popularity: 1,
          instagram_handle: null,
          instagram_url: null,
          instagram_followers: null,
          role_count: "1",
          known_for: null,
        },
      ],
      1,
      { limit: 10, offset: 0 },
    ).data;

    expect(actor?.imageUrl).toBe(
      "https://image.tmdb.org/t/p/w185/mDLDvsx8PaZoEThkBdyaG1JxPdf.jpg",
    );
  });

  it.each([
    ["not json", "malformed JSON"],
    ['{"a":1}', "a non-array"],
    ['[["movie",99.1,12,"Lead","Alpha"]]', "misshapen tuples"],
  ])("maps %s (%s) known_for to an empty list", (knownFor) => {
    const [actor] = toActorList(
      [
        {
          id: 7,
          name: "Actor",
          profile_path: null,
          popularity: 1,
          instagram_handle: null,
          instagram_url: null,
          instagram_followers: null,
          role_count: "1",
          known_for: knownFor,
        },
      ],
      1,
      { limit: 10, offset: 0 },
    ).data;

    expect(actor?.knownFor).toEqual([]);
  });
});
