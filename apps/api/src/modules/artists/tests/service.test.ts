import { describe, expect, it } from "vitest";

import { toArtistList } from "../service.ts";

describe("toArtistList", () => {
  it("prefers profile metadata and echoes pagination", () => {
    const artists = [
      {
        code2: "US",
        id: 42,
        image_url: "https://img/artist-42.jpg",
        name: "Artist Name",
        record_label: "Label A",
      },
      {
        code2: "",
        id: 43,
        image_url: "",
        name: "No Profile",
        record_label: "",
      },
    ];
    const profiles = [
      {
        id: 1,
        image_url: "https://img/profile-1.jpg",
        name: "Profile Name",
        source_id: 42,
      },
    ];

    expect(toArtistList(artists, profiles, { limit: 50, offset: 0 })).toEqual({
      data: [
        {
          countryCode: "US",
          id: 42,
          imageUrl: "https://img/profile-1.jpg",
          name: "Profile Name",
          recordLabel: "Label A",
        },
        {
          countryCode: null,
          id: 43,
          imageUrl: null,
          name: "No Profile",
          recordLabel: null,
        },
      ],
      meta: { limit: 50, offset: 0 },
    });
  });

  it("matches profiles whose source_id arrives as a string", () => {
    const artists = [
      { code2: "GB", id: 7, image_url: "", name: "Fallback", record_label: "" },
    ];
    const profiles = [
      { id: 2, image_url: null, name: "Linked", source_id: "7" },
    ];

    const reply = toArtistList(artists, profiles, { limit: 10, offset: 0 });

    expect(reply.data[0]?.name).toBe("Linked");
  });

  it("treats empty profile fields as missing and falls back", () => {
    const artists = [
      {
        code2: "",
        id: 7,
        image_url: "https://img/artist-7.jpg",
        name: "Artist",
        record_label: "",
      },
    ];
    const profiles = [{ id: 2, image_url: "", name: "", source_id: 7 }];

    const reply = toArtistList(artists, profiles, { limit: 10, offset: 0 });

    expect(reply.data[0]?.name).toBe("Artist");
    expect(reply.data[0]?.imageUrl).toBe("https://img/artist-7.jpg");
  });

  it("falls back to artist image when the profile has none", () => {
    const artists = [
      {
        code2: "",
        id: 7,
        image_url: "https://img/artist-7.jpg",
        name: "Artist",
        record_label: "",
      },
    ];
    const profiles = [{ id: 2, image_url: null, name: "Linked", source_id: 7 }];

    const reply = toArtistList(artists, profiles, { limit: 10, offset: 0 });

    expect(reply.data[0]?.imageUrl).toBe("https://img/artist-7.jpg");
  });

  it("returns an empty list untouched", () => {
    expect(toArtistList([], [], { limit: 10, offset: 20 })).toEqual({
      data: [],
      meta: { limit: 10, offset: 20 },
    });
  });
});
