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

const artistListReply = {
  data: { data: [artist], meta: { limit: 25, offset: 0 } },
};

const mockArtistRequests = (): void => {
  apiGetMock.mockImplementation(async () => {
    await Promise.resolve();

    return artistListReply;
  });
};

describe("ArtistsPage display modes", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    i18n.load("en", enMusic);
    i18n.activate("en");
  });

  it("disables the period selector until a change mode is picked", async () => {
    mockArtistRequests();

    renderArtistsPage();
    await screen.findByText("Selena Gomez");

    expect(
      screen.getByRole<HTMLInputElement>("radio", { name: "7D" }).disabled,
    ).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "% Change" }));

    await waitFor(() => {
      expect(
        screen.getByRole<HTMLInputElement>("radio", { name: "7D" }).disabled,
      ).toBe(false);
    });

    fireEvent.click(screen.getByRole("radio", { name: "Total" }));

    await waitFor(() => {
      expect(
        screen.getByRole<HTMLInputElement>("radio", { name: "7D" }).disabled,
      ).toBe(true);
    });
  });

  it("shows percent changes and sorts by them in % Change mode", async () => {
    mockArtistRequests();

    renderArtistsPage();
    await screen.findByText("Selena Gomez");

    fireEvent.click(screen.getByRole("radio", { name: "% Change" }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/artists", {
        params: {
          query: {
            changePeriod: "7d",
            limit: 25,
            offset: 0,
            sortBy: "cmScoreChangePercent",
            sortDirection: "desc",
          },
        },
      });
    });

    const table = screen.getByRole("table", { name: "Artists" });
    expect(within(table).getByText("+3.8%")).toBeDefined();
    expect(within(table).getByText("-2.5%")).toBeDefined();
    expect(within(table).getByText("+1.4%")).toBeDefined();

    fireEvent.click(screen.getByRole("radio", { name: "28D" }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/artists", {
        params: {
          query: {
            changePeriod: "28d",
            limit: 25,
            offset: 0,
            sortBy: "cmScoreChangePercent",
            sortDirection: "desc",
          },
        },
      });
    });
  });

  it("shows absolute changes in Change mode", async () => {
    mockArtistRequests();

    renderArtistsPage();
    await screen.findByText("Selena Gomez");

    fireEvent.click(screen.getByRole("radio", { name: "Change" }));

    const table = screen.getByRole("table", { name: "Artists" });
    await waitFor(() => {
      expect(within(table).getByText("+3.8M")).toBeDefined();
    });
    expect(within(table).getByText("-1.2M")).toBeDefined();
    expect(within(table).getByText("+1.2")).toBeDefined();
  });
});
