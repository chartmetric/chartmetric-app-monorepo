import { describe, expect, it } from "vitest";

import { toInfluencerList } from "../mapper.ts";

describe("toInfluencerList", () => {
  it("parses tag arrays, normalizes empty fields, and carries the total", () => {
    expect(
      toInfluencerList(
        [
          {
            creator_age_group: "25-34",
            creator_city: "Los Angeles",
            creator_country: "US",
            creator_gender: "female",
            creator_subtags: '["Pop", "Indie"]',
            creator_tags: '["Music", "News & Politics"]',
            id: 100,
            instagram_handle: "ava_ig",
            name: "Ava Creator",
            tiktok_handle: "",
            youtube_handle: "ava_yt",
          },
          {
            creator_age_group: "",
            creator_city: "",
            creator_country: "",
            creator_gender: "",
            creator_subtags: "not-json",
            creator_tags: "",
            id: 101,
            instagram_handle: "",
            name: "",
            tiktok_handle: "",
            youtube_handle: "",
          },
        ],
        { limit: 25, offset: 50 },
        137,
      ),
    ).toEqual({
      data: [
        {
          ageGroup: "25-34",
          categories: ["Music", "News & Politics"],
          city: "Los Angeles",
          country: "US",
          gender: "female",
          id: 100,
          instagramHandle: "ava_ig",
          name: "Ava Creator",
          subtags: ["Pop", "Indie"],
          tiktokHandle: null,
          youtubeHandle: "ava_yt",
        },
        {
          ageGroup: null,
          categories: [],
          city: null,
          country: null,
          gender: null,
          id: 101,
          instagramHandle: null,
          name: null,
          subtags: [],
          tiktokHandle: null,
          youtubeHandle: null,
        },
      ],
      meta: { limit: 25, offset: 50, total: 137 },
    });
  });
});
