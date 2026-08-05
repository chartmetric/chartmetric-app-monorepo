import { i18n } from "@lingui/core";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Artist } from "../types";

import { messages as enMusic } from "../../../../locales/music/en/messages.po";
import { renderArtistsPage as renderPage } from "./artists-page.test.helpers";

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

const artistListReply = {
  data: { data: [artist], meta: { limit: 25, offset: 0 } },
};

const filterOptions = {
  countries: [
    { count: 12, value: "US" },
    { count: 5, value: "KR" },
  ],
  genres: [
    { count: 9, value: "pop" },
    { count: 3, value: "rock" },
  ],
  instagramFollowers: { max: 500_000_000, min: 0 },
  tiktokFollowers: { max: 150_000_000, min: 0 },
};

const mockArtistRequests = (listReply = artistListReply): void => {
  apiGetMock.mockImplementation(async (path: string) => {
    await Promise.resolve();

    return path === "/app/artists/filter-options"
      ? { data: filterOptions }
      : listReply;
  });
};

describe("ArtistsPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    i18n.load("en", enMusic);
    i18n.activate("en");
  });

  it("renders loading and artist data from the generated client", async () => {
    mockArtistRequests();

    renderPage();

    expect(screen.getByRole("status")).toBeDefined();
    expect(await screen.findByText("Selena Gomez")).toBeDefined();
    const table = screen.getByRole("table", { name: "Artists" });
    expect(within(table).getByText("United States")).toBeDefined();
    expect(within(table).getByText("88.3")).toBeDefined();
    expect(within(table).getByText("404.7M")).toBeDefined();
    expect(within(table).getByText("58.7M")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Sort by CM score" }),
    ).toBeDefined();
  });

  it("shows the country below the artist name instead of the ID", async () => {
    mockArtistRequests();

    renderPage();

    const table = await screen.findByRole("table", { name: "Artists" });
    const row = within(table).getByText("Selena Gomez").closest("tr");
    expect(row).not.toBeNull();
    if (row === null) throw new Error("missing artist row");
    expect(within(row).getByText("United States")).toBeDefined();
    expect(within(row).queryByText("ID 3168")).toBeNull();
  });

  it("marks verified artists with a badge", async () => {
    mockArtistRequests({
      data: {
        data: [artist, { ...artist, id: 2, isVerified: false, name: "Indie" }],
        meta: { limit: 25, offset: 0 },
      },
    });

    renderPage();

    const table = await screen.findByRole("table", { name: "Artists" });
    const verifiedRow = within(table).getByText("Selena Gomez").closest("tr");
    const unverifiedRow = within(table).getByText("Indie").closest("tr");
    if (verifiedRow === null || unverifiedRow === null) {
      throw new Error("missing artist rows");
    }
    expect(within(verifiedRow).getByLabelText("Verified artist")).toBeDefined();
    expect(
      within(unverifiedRow).queryByLabelText("Verified artist"),
    ).toBeNull();
  });

  it("shows a placeholder for missing metrics", async () => {
    mockArtistRequests({
      data: {
        data: [
          {
            ...artist,
            cmScore: null,
            countryCode: null,
            instagramFollowers: null,
            tiktokFollowers: null,
          },
        ],
        meta: { limit: 25, offset: 0 },
      },
    });

    renderPage();

    const table = await screen.findByRole("table", { name: "Artists" });
    const row = within(table).getByText("Selena Gomez").closest("tr");
    expect(row).not.toBeNull();
    if (row === null) throw new Error("missing artist row");
    expect(within(row).getAllByText("—")).toHaveLength(3);
    expect(within(row).queryByText("United States")).toBeNull();
  });

  it("renders an empty state", async () => {
    mockArtistRequests({
      data: { data: [], meta: { limit: 25, offset: 0 } },
    });

    renderPage();

    expect(await screen.findByText("No artists found")).toBeDefined();
  });

  it("renders an error state and retries", async () => {
    let artistRequestCount = 0;
    apiGetMock.mockImplementation(async (path: string) => {
      await Promise.resolve();

      if (path === "/app/artists/filter-options") {
        return { data: filterOptions };
      }

      artistRequestCount += 1;

      return artistRequestCount === 1
        ? { error: { message: "failed" } }
        : artistListReply;
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Selena Gomez")).toBeDefined();
    expect(artistRequestCount).toBe(2);
  });

  it("requests the next page with its offset", async () => {
    mockArtistRequests({
      data: {
        data: Array.from({ length: 25 }, (_, index) => ({
          ...artist,
          id: index + 1,
          name: `Artist ${String(index + 1)}`,
        })),
        meta: { limit: 25, offset: 0 },
      },
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/artists", {
        params: {
          query: {
            changePeriod: "7d",
            limit: 25,
            offset: 25,
            sortBy: "cmScore",
            sortDirection: "desc",
          },
        },
      });
    });
    expect(await screen.findByText("Page 2")).toBeDefined();
  });

  it("marks the table busy while a sort refetch is in flight", async () => {
    let canResolveSecondRequest = false;
    let artistRequestCount = 0;
    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/app/artists/filter-options") {
        await Promise.resolve();
        return { data: filterOptions };
      }

      artistRequestCount += 1;

      if (artistRequestCount === 1) {
        await Promise.resolve();
        return artistListReply;
      }

      await vi.waitFor(() => {
        expect(canResolveSecondRequest).toBe(true);
      });
      return artistListReply;
    });

    renderPage();

    const table = await screen.findByRole("table", { name: "Artists" });
    const busyContainer = table.closest("[aria-busy]");
    expect(busyContainer?.getAttribute("aria-busy")).toBe("false");

    fireEvent.click(
      screen.getByRole("button", { name: "Sort by Instagram followers" }),
    );

    await waitFor(() => {
      expect(busyContainer?.getAttribute("aria-busy")).toBe("true");
    });
    expect(screen.getAllByLabelText("Updating artists")).not.toHaveLength(0);

    canResolveSecondRequest = true;

    await waitFor(() => {
      expect(busyContainer?.getAttribute("aria-busy")).toBe("false");
    });
  });

  it("changes server-side sorting and toggles direction", async () => {
    mockArtistRequests();

    renderPage();

    const sortButton = await screen.findByRole("button", {
      name: "Sort by Instagram followers",
    });

    fireEvent.click(sortButton);

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/artists", {
        params: {
          query: {
            changePeriod: "7d",
            limit: 25,
            offset: 0,
            sortBy: "instagramFollowers",
            sortDirection: "desc",
          },
        },
      });
    });

    fireEvent.click(sortButton);

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/artists", {
        params: {
          query: {
            changePeriod: "7d",
            limit: 25,
            offset: 0,
            sortBy: "instagramFollowers",
            sortDirection: "asc",
          },
        },
      });
    });
  });
});
