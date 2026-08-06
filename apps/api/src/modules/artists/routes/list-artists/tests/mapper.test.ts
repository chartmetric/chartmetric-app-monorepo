import { describe, expect, it } from "vitest";

import { toArtistList } from "../mapper.ts";

const baseRow = {
  cm_score: null,
  cm_score_change: null,
  cm_score_change_percent: null,
  code2: "",
  id: 1,
  image_url: "",
  instagram_followers: null,
  instagram_followers_change: null,
  instagram_followers_change_percent: null,
  is_verified: null,
  name: "Artist",
  profile_image_url: null,
  profile_name: null,
  record_label: "",
  tiktok_followers: null,
  tiktok_followers_change: null,
  tiktok_followers_change_percent: null,
};

describe("toArtistList", () => {
  it("prefers profile metadata and echoes pagination", () => {
    const artists = [
      {
        ...baseRow,
        cm_score: 88.3,
        cm_score_change: 1.2,
        cm_score_change_percent: 1.377,
        code2: "US",
        id: 42,
        image_url: "https://img/artist-42.jpg",
        instagram_followers: "404690279",
        instagram_followers_change: "250000",
        instagram_followers_change_percent: 0.0618,
        is_verified: 1,
        name: "Artist Name",
        profile_image_url: "https://img/profile-42.jpg",
        profile_name: "Profile Name",
        record_label: "Label A",
        tiktok_followers: "58708640",
        tiktok_followers_change: -12_345,
        tiktok_followers_change_percent: -0.021,
      },
      { ...baseRow, id: 43, name: "No Profile" },
    ];

    expect(toArtistList(artists, { limit: 50, offset: 0 })).toEqual({
      data: [
        {
          cmScore: 88.3,
          cmScoreChange: 1.2,
          cmScoreChangePercent: 1.377,
          countryCode: "US",
          id: 42,
          imageUrl: "https://img/profile-42.jpg",
          instagramFollowers: 404_690_279,
          instagramFollowersChange: 250_000,
          instagramFollowersChangePercent: 0.0618,
          isVerified: true,
          name: "Profile Name",
          recordLabel: "Label A",
          tiktokFollowers: 58_708_640,
          tiktokFollowersChange: -12_345,
          tiktokFollowersChangePercent: -0.021,
        },
        {
          cmScore: null,
          cmScoreChange: null,
          cmScoreChangePercent: null,
          countryCode: null,
          id: 43,
          imageUrl: null,
          instagramFollowers: null,
          instagramFollowersChange: null,
          instagramFollowersChangePercent: null,
          isVerified: false,
          name: "No Profile",
          recordLabel: null,
          tiktokFollowers: null,
          tiktokFollowersChange: null,
          tiktokFollowersChangePercent: null,
        },
      ],
      meta: { limit: 50, offset: 0 },
    });
  });

  it("treats empty profile fields as missing and falls back", () => {
    const artists = [
      {
        ...baseRow,
        id: 7,
        image_url: "https://img/artist-7.jpg",
        profile_image_url: "",
        profile_name: "",
      },
    ];

    const reply = toArtistList(artists, { limit: 10, offset: 0 });

    expect(reply.data[0]?.name).toBe("Artist");
    expect(reply.data[0]?.imageUrl).toBe("https://img/artist-7.jpg");
  });

  it("falls back to artist image when the profile has none", () => {
    const artists = [
      {
        ...baseRow,
        id: 7,
        image_url: "https://img/artist-7.jpg",
        profile_name: "Linked",
      },
    ];

    const reply = toArtistList(artists, { limit: 10, offset: 0 });

    expect(reply.data[0]?.name).toBe("Linked");
    expect(reply.data[0]?.imageUrl).toBe("https://img/artist-7.jpg");
  });

  it("converts numeric follower counts as well as strings", () => {
    const artists = [
      { ...baseRow, instagram_followers: 123, tiktok_followers: "456" },
    ];

    const reply = toArtistList(artists, { limit: 10, offset: 0 });

    expect(reply.data[0]?.instagramFollowers).toBe(123);
    expect(reply.data[0]?.tiktokFollowers).toBe(456);
  });

  it("reports an unreadable follower count as missing, not as zero", () => {
    const artists = [
      {
        ...baseRow,
        instagram_followers: "",
        instagram_followers_change: "not-a-number",
        tiktok_followers: 0,
      },
    ];

    const reply = toArtistList(artists, { limit: 10, offset: 0 });

    expect(reply.data[0]?.instagramFollowers).toBeNull();
    expect(reply.data[0]?.instagramFollowersChange).toBeNull();
    expect(reply.data[0]?.tiktokFollowers).toBe(0);
  });

  it("returns an empty list untouched", () => {
    expect(toArtistList([], { limit: 10, offset: 20 })).toEqual({
      data: [],
      meta: { limit: 10, offset: 20 },
    });
  });
});
