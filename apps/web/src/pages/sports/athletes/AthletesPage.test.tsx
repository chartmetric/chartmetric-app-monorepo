import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Athlete } from "./api/types";

import { messages as enSports } from "../../../locales/sports/en/messages.po";
import { AthletesPage } from "./AthletesPage";

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

describe("AthletesPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    localStorage.clear();
    i18n.load("en", enSports);
    i18n.activate("en");
  });

  it("renders loading and the default columns from the generated client", async () => {
    mockSuccessfulRequests();

    renderPage();

    expect(screen.getByRole("status")).toBeDefined();
    expect(await screen.findByText("Alex Morgan")).toBeDefined();

    const table = screen.getByRole("table", { name: "Athletes" });

    expect(within(table).getByText("Orlando Pride")).toBeDefined();
    expect(within(table).getByText("Major League Soccer")).toBeDefined();
    expect(within(table).getByText("United States")).toBeDefined();
    expect(within(table).getByText("FW")).toBeDefined();
    expect(within(table).getByText("36")).toBeDefined();
    expect(within(table).getByText("10M")).toBeDefined();
    expect(within(table).getByText("1,200")).toBeDefined();
  });

  it("pins rank and athlete and hides non-default columns", async () => {
    mockSuccessfulRequests();

    renderPage();

    const table = await screen.findByRole("table", { name: "Athletes" });

    expect(
      within(table).getByRole("button", { name: "Sort by Rank" }),
    ).toBeDefined();
    expect(
      within(table).getByRole("button", { name: "Sort by Athlete" }),
    ).toBeDefined();
    expect(within(table).queryByText("GPS")).toBeNull();
    expect(within(table).queryByText("Momentum")).toBeNull();
  });

  it("shows the filtered total alongside the page range", async () => {
    mockSuccessfulRequests(
      listReply(
        Array.from({ length: 25 }, (_, index) =>
          buildAthlete({ id: index + 1, name: `Athlete ${String(index + 1)}` }),
        ),
        { limit: 25, offset: 0, total: 2948 },
      ),
    );

    renderPage();

    expect(
      await screen.findByText("Showing 1–25 of 2,948 athletes"),
    ).toBeDefined();
    expect(screen.getByText("Page 1 of 118")).toBeDefined();
  });

  it("renders an empty state", async () => {
    mockSuccessfulRequests(listReply([], { limit: 25, offset: 0, total: 0 }));

    renderPage();

    expect(await screen.findByText("No athletes found")).toBeDefined();
  });

  it("renders an error state and retries", async () => {
    let athleteRequestCount = 0;

    apiGetMock.mockImplementation(async (path: string) => {
      await Promise.resolve();

      if (path === "/app/athletes/filter-options") {
        return { data: FILTER_OPTIONS };
      }

      athleteRequestCount += 1;

      return athleteRequestCount === 1
        ? { error: { message: "failed" } }
        : listReply();
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Alex Morgan")).toBeDefined();
    expect(athleteRequestCount).toBe(2);
  });

  it("requests the next page with its offset", async () => {
    mockSuccessfulRequests(
      listReply(
        Array.from({ length: 25 }, (_, index) =>
          buildAthlete({ id: index + 1, name: `Athlete ${String(index + 1)}` }),
        ),
        { limit: 25, offset: 0, total: 60 },
      ),
    );

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Next" }));

    await expectQuery({ ...DEFAULT_QUERY, offset: 25 });
  });

  it("applies name changes automatically and changes server-side sorting", async () => {
    mockSuccessfulRequests();

    renderPage();

    fireEvent.change(
      await screen.findByRole("textbox", { name: "Search by name" }),
      { target: { value: "  Alex  " } },
    );

    await expectQuery({ ...DEFAULT_QUERY, name: "Alex" });

    fireEvent.click(screen.getByRole("button", { name: "Sort by Athlete" }));

    await expectQuery({
      limit: 25,
      name: "Alex",
      offset: 0,
      sortBy: "name",
      sortDirection: "asc",
    });
  });

  it("sorts a metric column descending on first click", async () => {
    mockSuccessfulRequests();

    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Sort by Followers" }),
    );

    await expectQuery({
      limit: 25,
      offset: 0,
      sortBy: "igFollowers",
      sortDirection: "desc",
    });
  });

  it("adds a column through a saved column group and persists the choice", async () => {
    mockSuccessfulRequests();

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Columns/u }));
    fireEvent.click(await screen.findByRole("button", { name: "Football" }));

    const table = await screen.findByRole("table", { name: "Athletes" });

    expect(within(table).getByText("GPS")).toBeDefined();
    expect(
      JSON.parse(
        localStorage.getItem("sports.athletes.visibleColumns") ?? "[]",
      ),
    ).toContain("gpsScore");
  });

  it("restores persisted columns on the next render", async () => {
    localStorage.setItem(
      "sports.athletes.visibleColumns",
      JSON.stringify(["level"]),
    );
    mockSuccessfulRequests();

    renderPage();

    const table = await screen.findByRole("table", { name: "Athletes" });

    expect(within(table).getByText("Level")).toBeDefined();
    expect(within(table).getByText("Pro")).toBeDefined();
    expect(within(table).queryByText("Nationality")).toBeNull();
  });

  it("ignores a persisted value that no longer matches a column", async () => {
    localStorage.setItem(
      "sports.athletes.visibleColumns",
      JSON.stringify(["removedColumn"]),
    );
    mockSuccessfulRequests();

    renderPage();

    const table = await screen.findByRole("table", { name: "Athletes" });

    expect(within(table).getByText("Nationality")).toBeDefined();
  });
});
