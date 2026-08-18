import { i18n } from "@lingui/core";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Artist } from "../types";

import { messages as enMusic } from "../../../../locales/music/en/messages.po";
import { renderArtistsPage } from "./artists-page.test.helpers";

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../api/client", () => ({
  apiClient: { GET: apiGetMock },
}));

const artist: Artist = {
  cmScore: 88.3,
  cmScoreChange: 1.2,
  cmScoreChangePercent: 1.377,
  countryCode: "US",
  id: 3168,
  imageUrl: "https://img/artist-3168.jpg",
  instagramFollowers: 404_690_279,
  instagramFollowersChange: 3_777_694,
  instagramFollowersChangePercent: 3.815,
  isVerified: true,
  name: "Selena Gomez",
  recordLabel: "Interscope",
  tiktokFollowers: 58_708_640,
  tiktokFollowersChange: -1_234_567,
  tiktokFollowersChangePercent: -2.5,
};

const mockRequests = (): void => {
  apiGetMock.mockImplementation(async (path: string) => {
    await Promise.resolve();

    return path === "/app/artists/filter-options"
      ? {
          data: {
            countries: [{ count: 1, value: "US" }],
            genres: [{ count: 1, value: "pop" }],
            instagramFollowers: { max: 500_000_000, min: 0 },
            tiktokFollowers: { max: 150_000_000, min: 0 },
          },
        }
      : { data: { data: [artist], meta: { limit: 25, offset: 0 } } };
  });
};

const headerTexts = (): string[] =>
  within(screen.getByRole("table", { name: "Artists" }))
    .getAllByRole("columnheader")
    .map((header) => header.textContent);

describe("ArtistsPage columns", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    i18n.load("en", enMusic);
    i18n.activate("en");
  });

  it("hides a column when it is unchecked", async () => {
    mockRequests();

    renderArtistsPage();
    await screen.findByText("Selena Gomez");

    fireEvent.click(screen.getByRole("button", { name: /Columns/ }));
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "TikTok followers" }),
    );

    await waitFor(() => {
      expect(headerTexts().join(" ")).not.toContain("TikTok followers");
    });
    expect(headerTexts().join(" ")).toContain("Instagram followers");
  });

  it("keeps the artist column locked", async () => {
    mockRequests();

    renderArtistsPage();
    await screen.findByText("Selena Gomez");

    fireEvent.click(screen.getByRole("button", { name: /Columns/ }));
    const artistCheckbox = await screen.findByRole<HTMLInputElement>(
      "checkbox",
      { name: "Artist" },
    );

    expect(artistCheckbox.disabled).toBe(true);
    expect(artistCheckbox.checked).toBe(true);
    expect(screen.queryByRole("button", { name: "Reorder Artist" })).toBeNull();
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Move Artist down",
      }).disabled,
    ).toBe(true);
  });

  it("reorders columns from the picker", async () => {
    mockRequests();

    renderArtistsPage();
    await screen.findByText("Selena Gomez");

    expect(headerTexts()).toEqual([
      "Artist",
      "CM score",
      "Instagram followers",
      "TikTok followers",
    ]);

    fireEvent.click(screen.getByRole("button", { name: /Columns/ }));
    // An explicit button rather than an arrow key on a drag handle, so the
    // reorder works for keyboard and touch without a pointer gesture.
    fireEvent.click(
      await screen.findByRole("button", { name: "Move CM score down" }),
    );

    await waitFor(() => {
      expect(headerTexts()).toEqual([
        "Artist",
        "Instagram followers",
        "CM score",
        "TikTok followers",
      ]);
    });
  });
});
