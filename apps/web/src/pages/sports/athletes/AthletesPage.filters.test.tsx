import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Athlete } from "./api/types";

import { messages as enSports } from "../../../locales/sports/en/messages.po";
import { AthletesPage } from "./AthletesPage";
import {
  findEnabledControl,
  getControlledOption,
  getControlledRadio,
} from "./AthletesPage.test.helpers";

const buildAthlete = (overrides: Partial<Athlete> = {}): Athlete => ({
  age: 36,
  club: "Orlando Pride",
  cmScore: 87.4,
  gpsAtk: null,
  gpsDef: null,
  gpsScore: null,
  id: 42,
  igEngagementRate: null,
  igFollowers: 10_000_000,
  igPosts: 1200,
  igVerified: true,
  imageUrl: "https://img/athlete-42.jpg",
  lastMatchDate: "2026-07-06",
  leagues: ["Major League Soccer"],
  level: "professional",
  momentumLabel: null,
  momentumScore: null,
  name: "Alex Morgan",
  nationality: "United States",
  nationalTeam: "United States",
  position: "FW",
  rank: 1,
  socialLinks: [
    {
      handle: "alexmorgan13",
      platform: "instagram",
      url: "https://www.instagram.com/alexmorgan13",
    },
  ],
  sport: "Football",
  teamLogoUrl: null,
  tiktokFollowers: null,
  tiktokHearts: null,
  tiktokLikes: null,
  tiktokPosts: null,
  tiktokVideos: null,
  turnedPro: null,
  ...overrides,
});

const FILTER_OPTIONS = {
  clubsBySport: { Football: { "Major League Soccer": ["Orlando Pride"] } },
  cmScore: { max: 99.4, min: 12.5 },
  leaguesBySport: { Football: ["Major League Soccer"], Tennis: ["ATP"] },
  nationalities: [{ count: 1, value: "United States" }],
  sports: [
    { count: 2, value: "Football" },
    { count: 1, value: "Tennis" },
  ],
  sportsByLevel: { college: ["Volleyball"], professional: ["Football"] },
};

const DEFAULT_QUERY = {
  limit: 25,
  offset: 0,
  sortBy: "rank",
  sortDirection: "asc",
} as const;

const FIRST_PAGE_META = { limit: 25, offset: 0, total: 1 };

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock("../../../api/client", () => ({
  apiClient: { GET: apiGetMock },
}));

interface ListMeta {
  limit: number;
  offset: number;
  total: number;
}

const listReply = (
  athletes: Athlete[] = [buildAthlete()],
  meta: ListMeta = FIRST_PAGE_META,
): { data: { data: Athlete[]; meta: ListMeta } } => ({
  data: { data: athletes, meta },
});

const mockSuccessfulRequests = (reply = listReply()): void => {
  apiGetMock.mockImplementation(async (path: string) => {
    await Promise.resolve();

    return path === "/app/athletes/filter-options"
      ? { data: FILTER_OPTIONS }
      : reply;
  });
};

const expectQuery = async (query: Record<string, unknown>): Promise<void> => {
  await waitFor(() => {
    expect(apiGetMock).toHaveBeenCalledWith("/app/athletes", {
      params: { query },
    });
  });
};

const renderPage = (): void => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <AthletesPage />
        </MantineProvider>
      </QueryClientProvider>
    </I18nProvider>,
  );
};

describe("AthletesPage filters", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    localStorage.clear();
    i18n.load("en", enSports);
    i18n.activate("en");
  });

  it("applies category selection, exclusion, and removal automatically", async () => {
    mockSuccessfulRequests();

    renderPage();

    let sportFilter = await findEnabledControl("combobox", "Sport");

    fireEvent.click(sportFilter);
    fireEvent.click(getControlledOption(sportFilter, /Football/u));

    await expectQuery({ ...DEFAULT_QUERY, sports: ["Football"] });

    // Include and exclude are separate lists, so the tab is a view rather than a
    // mode: switching it leaves the selection alone until the option is picked
    // again, which then moves it across.
    fireEvent.click(getControlledRadio(sportFilter, "Exclude"));

    await expectQuery({ ...DEFAULT_QUERY, sports: ["Football"] });

    sportFilter = screen.getByRole<HTMLButtonElement>("combobox", {
      name: "Sport",
    });
    fireEvent.click(getControlledOption(sportFilter, /Football/u));

    await expectQuery({ ...DEFAULT_QUERY, excludeSports: ["Football"] });

    sportFilter = screen.getByRole<HTMLButtonElement>("combobox", {
      name: "Sport",
    });
    fireEvent.click(getControlledOption(sportFilter, /Football/u));

    await expectQuery(DEFAULT_QUERY);
  });

  it("filters by league and resets the team selection when leagues change", async () => {
    mockSuccessfulRequests();

    renderPage();

    const leagueFilter = await findEnabledControl("combobox", "League");

    fireEvent.click(leagueFilter);
    fireEvent.click(getControlledOption(leagueFilter, /Major League Soccer/u));

    await expectQuery({
      ...DEFAULT_QUERY,
      leagues: ["Major League Soccer"],
    });
  });

  it("filters by team", async () => {
    mockSuccessfulRequests();

    renderPage();

    const teamFilter = await findEnabledControl("combobox", "Team");

    fireEvent.click(teamFilter);
    fireEvent.click(getControlledOption(teamFilter, /Orlando Pride/u));

    await expectQuery({ ...DEFAULT_QUERY, clubs: ["Orlando Pride"] });
  });

  it("applies the level, follower, and verified quick filters", async () => {
    mockSuccessfulRequests();

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "College" }));
    await expectQuery({ ...DEFAULT_QUERY, levels: ["college"] });

    fireEvent.click(screen.getByRole("button", { name: "10M+" }));
    await expectQuery({
      ...DEFAULT_QUERY,
      levels: ["college"],
      minFollowers: 10_000_000,
    });

    fireEvent.click(screen.getByRole("button", { name: "Verified" }));
    await expectQuery({
      ...DEFAULT_QUERY,
      levels: ["college"],
      minFollowers: 10_000_000,
      verified: true,
    });
  });

  it("treats the under-1M pill as an upper bound", async () => {
    mockSuccessfulRequests();

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "<1M" }));

    await expectQuery({ ...DEFAULT_QUERY, maxFollowers: 1_000_000 });
  });

  it("clears every filter at once", async () => {
    mockSuccessfulRequests();

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "College" }));
    await expectQuery({ ...DEFAULT_QUERY, levels: ["college"] });

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    await expectQuery(DEFAULT_QUERY);
  });

  it("applies a CM score range", async () => {
    mockSuccessfulRequests();

    renderPage();

    fireEvent.click(await findEnabledControl("button", "CM score"));

    const minimumInput = await screen.findByRole<HTMLInputElement>("textbox", {
      name: "Minimum CM score",
    });
    const maximumInput = screen.getByRole<HTMLInputElement>("textbox", {
      hidden: true,
      name: "Maximum CM score",
    });

    expect(minimumInput.value).toBe("12.5");
    expect(maximumInput.value).toBe("99.4");
    fireEvent.change(minimumInput, { target: { value: "70" } });
    fireEvent.change(maximumInput, { target: { value: "90" } });

    await expectQuery({
      ...DEFAULT_QUERY,
      maxCmScore: 90,
      minCmScore: 70,
    });
  });
});
