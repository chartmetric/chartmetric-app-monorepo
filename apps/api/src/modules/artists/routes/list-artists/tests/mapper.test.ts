import { describe, expect, it } from "vitest";

import { toArtistList } from "../mapper.ts";

const baseRow = {
  cm_score: null,
  code2: "",
  id: 1,
  image_url: "",
  instagram_followers: null,
  is_verified: null,
  name: "Artist",
  profile_image_url: null,
  profile_name: null,
  record_label: "",
  tiktok_followers: null,
};

describe("toArtistList", () => {
  it("prefers profile metadata and echoes pagination", () => {
    const artists = [
      {
        ...baseRow,
        cm_score: 88.3,
        code2: "US",
        id: 42,
        image_url: "https://img/artist-42.jpg",
        instagram_followers: "404690279",
        is_verified: 1,
        name: "Artist Name",
        profile_image_url: "https://img/profile-42.jpg",
        profile_name: "Profile Name",
        record_label: "Label A",
        tiktok_followers: "58708640",
      },
      { ...baseRow, id: 43, name: "No Profile" },
    ];

    expect(toArtistList(artists, { limit: 50, offset: 0 })).toEqual({
      data: [
        {
          cmScore: 88.3,
          countryCode: "US",
          id: 42,
          imageUrl: "https://img/profile-42.jpg",
          instagramFollowers: 404_690_279,
          isVerified: true,
          name: "Profile Name",
          recordLabel: "Label A",
          tiktokFollowers: 58_708_640,
        },
        {
          cmScore: null,
          countryCode: null,
          id: 43,
          imageUrl: null,
          instagramFollowers: null,
          isVerified: false,
          name: "No Profile",
          recordLabel: null,
          tiktokFollowers: null,
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

  it("returns an empty list untouched", () => {
    expect(toArtistList([], { limit: 10, offset: 20 })).toEqual({
      data: [],
      meta: { limit: 10, offset: 20 },
    });
  });
});
