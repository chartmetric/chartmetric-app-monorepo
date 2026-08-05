import { i18n } from "@lingui/core";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Artist } from "../types";

import { messages as enMusic } from "../../../../locales/music/en/messages.po";
import {
  findEnabledControl,
  getControlledOption,
  renderArtistsPage,
} from "./artists-page.test.helpers";

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

const mockRequests = (): void => {
  apiGetMock.mockImplementation(async (path: string) => {
    await Promise.resolve();

    return path === "/app/artists/filter-options"
      ? { data: filterOptions }
      : { data: { data: [artist], meta: { limit: 25, offset: 0 } } };
  });
};

const expectedQuery = (
  filters: Record<string, unknown>,
): Record<string, unknown> => ({
  changePeriod: "7d",
  limit: 25,
  offset: 0,
  sortBy: "cmScore",
  sortDirection: "desc",
  ...filters,
});

describe("ArtistsPage filters", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    i18n.load("en", enMusic);
    i18n.activate("en");
  });

  it("applies a genre selection from the inline filter bar", async () => {
    mockRequests();

    renderArtistsPage();
    await screen.findByText("Selena Gomez");

    const genreControl = await findEnabledControl("combobox", "Genre");
    fireEvent.click(genreControl);
    fireEvent.click(getControlledOption(genreControl, /pop/));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/artists", {
        params: { query: expectedQuery({ genres: ["pop"] }) },
      });
    });
  });

  it("applies an Instagram follower range from the inline filter bar", async () => {
    mockRequests();

    renderArtistsPage();
    await screen.findByText("Selena Gomez");

    fireEvent.click(
      screen.getByRole("button", { name: "Instagram followers" }),
    );
    fireEvent.change(
      await screen.findByRole("textbox", {
        name: "Minimum Instagram followers",
      }),
      { target: { value: "1000000" } },
    );

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/artists", {
        params: {
          query: expectedQuery({
            maxInstagramFollowers: 500_000_000,
            minInstagramFollowers: 1_000_000,
          }),
        },
      });
    });
  });

  it("applies country and TikTok range filters from the drawer", async () => {
    mockRequests();

    renderArtistsPage();
    await screen.findByText("Selena Gomez");

    fireEvent.click(screen.getByRole("button", { name: "All filters" }));
    const drawer = await screen.findByRole("dialog");

    fireEvent.click(
      within(drawer).getByRole("checkbox", { name: /South Korea/ }),
    );

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/artists", {
        params: { query: expectedQuery({ countries: ["KR"] }) },
      });
    });

    fireEvent.change(
      within(drawer).getByRole("textbox", {
        name: "Maximum TikTok followers",
      }),
      { target: { value: "5000" } },
    );

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/artists", {
        params: {
          query: expectedQuery({
            countries: ["KR"],
            maxTiktokFollowers: 5000,
          }),
        },
      });
    });
  });

  it("combines included and excluded countries", async () => {
    mockRequests();

    renderArtistsPage();
    await screen.findByText("Selena Gomez");

    fireEvent.click(screen.getByRole("button", { name: "All filters" }));
    const drawer = await screen.findByRole("dialog");

    fireEvent.click(
      within(drawer).getByRole("checkbox", { name: /South Korea/ }),
    );
    const unitedStates = within(drawer).getByRole("checkbox", {
      name: /United States/,
    });
    fireEvent.click(unitedStates);
    fireEvent.click(unitedStates);

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/artists", {
        params: {
          query: expectedQuery({
            countries: ["KR"],
            excludeCountries: ["US"],
          }),
        },
      });
    });
  });

  it("debounces rapid filter changes into a single query", async () => {
    mockRequests();

    renderArtistsPage();
    await screen.findByText("Selena Gomez");

    fireEvent.click(screen.getByRole("button", { name: "All filters" }));
    const drawer = await screen.findByRole("dialog");
    const maximumInput = within(drawer).getByRole("textbox", {
      name: "Maximum TikTok followers",
    });

    fireEvent.change(maximumInput, { target: { value: "5" } });
    fireEvent.change(maximumInput, { target: { value: "50" } });
    fireEvent.change(maximumInput, { target: { value: "5000" } });

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/artists", {
        params: { query: expectedQuery({ maxTiktokFollowers: 5000 }) },
      });
    });
    expect(apiGetMock).not.toHaveBeenCalledWith("/app/artists", {
      params: { query: expectedQuery({ maxTiktokFollowers: 5 }) },
    });
    expect(apiGetMock).not.toHaveBeenCalledWith("/app/artists", {
      params: { query: expectedQuery({ maxTiktokFollowers: 50 }) },
    });
  });

  it("clears every filter at once", async () => {
    mockRequests();

    renderArtistsPage();
    await screen.findByText("Selena Gomez");

    const genreControl = await findEnabledControl("combobox", "Genre");
    fireEvent.click(genreControl);
    fireEvent.click(getControlledOption(genreControl, /rock/));
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/artists", {
        params: { query: expectedQuery({}) },
      });
    });
  });
});
