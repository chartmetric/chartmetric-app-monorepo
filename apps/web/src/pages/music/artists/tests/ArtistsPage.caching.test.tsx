import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { messages as enMusic } from "../../../../locales/music/en/messages.po";
import { createQueryClient } from "../../../../query-client";
import { ArtistsPage } from "../ArtistsPage";
import {
  findEnabledControl,
  getControlledOption,
} from "./artists-page.test.helpers";

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../api/client", () => ({
  apiClient: { GET: apiGetMock },
}));

const reply = (
  names: string[],
): { data: { data: unknown[]; meta: { limit: number; offset: number } } } => ({
  data: {
    data: names.map((name, index) => ({
      cmScore: 50,
      cmScoreChange: null,
      cmScoreChangePercent: null,
      countryCode: "US",
      id: index + 1,
      imageUrl: null,
      instagramFollowers: null,
      instagramFollowersChange: null,
      instagramFollowersChangePercent: null,
      isVerified: false,
      name,
      recordLabel: null,
      tiktokFollowers: null,
      tiktokFollowersChange: null,
      tiktokFollowersChangePercent: null,
    })),
    meta: { limit: 25, offset: 0 },
  },
});

describe("filter changes with production query-client defaults", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    i18n.load("en", enMusic);
    i18n.activate("en");
  });

  it("fetches and marks busy when a filter changes", async () => {
    apiGetMock.mockImplementation(
      async (
        path: string,
        args?: { params?: { query?: { genres?: string[] } } },
      ) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (path === "/app/artists/filter-options") {
          return {
            data: {
              countries: [{ count: 1, value: "US" }],
              genres: [{ count: 1, value: "pop" }],
              instagramFollowers: { max: 1000, min: 0 },
              tiktokFollowers: { max: 1000, min: 0 },
            },
          };
        }
        return reply([
          args?.params?.query?.genres === undefined
            ? "Unfiltered Artist"
            : "Filtered Artist",
        ]);
      },
    );

    render(
      <I18nProvider i18n={i18n}>
        <QueryClientProvider client={createQueryClient()}>
          <MantineProvider>
            <ArtistsPage />
          </MantineProvider>
        </QueryClientProvider>
      </I18nProvider>,
    );

    await screen.findByText("Unfiltered Artist");

    const genreControl = await findEnabledControl("combobox", "Genre");
    fireEvent.click(genreControl);
    fireEvent.click(getControlledOption(genreControl, /pop/));

    const table = screen.getByRole("table", { name: "Artists" });
    const busyContainer = table.closest("[aria-busy]");

    await waitFor(() => {
      expect(busyContainer?.getAttribute("aria-busy")).toBe("true");
    });
    expect(await screen.findByText("Filtered Artist")).toBeDefined();
  });
});
