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

import { messages as enSports } from "../../../locales/sports/en/messages.po";
import { LeaguesPage } from "./LeaguesPage";
import {
  buildLeague,
  buildReply,
  FILTER_OPTIONS,
} from "./LeaguesPage.test.helpers";

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock("../../../api/client", () => ({
  apiClient: { GET: apiGetMock },
}));

const renderPage = (): void => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <LeaguesPage />
        </MantineProvider>
      </QueryClientProvider>
    </I18nProvider>,
  );
};

const mockLeagues = (reply: unknown): void => {
  apiGetMock.mockImplementation(async (path: string) => {
    await Promise.resolve();

    return path === "/app/leagues/filter-options"
      ? { data: FILTER_OPTIONS }
      : reply;
  });
};

describe("LeaguesPage states", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    i18n.load("en", enSports);
    i18n.activate("en");
  });

  it("shows a full-page skeleton while the first page loads", () => {
    apiGetMock.mockImplementation(async () => await new Promise(() => null));

    renderPage();

    expect(
      screen.getByRole("status", { name: "Loading leagues" }),
    ).toBeTruthy();
  });

  it("offers a retry when the list request fails", async () => {
    mockLeagues({ data: undefined });

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Unable to load leagues" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(apiGetMock.mock.calls.length).toBeGreaterThan(2);
    });
  });

  it("explains an empty result instead of rendering an empty table", async () => {
    mockLeagues({ data: buildReply([], 0) });

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "No leagues found" }),
    ).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("renders the league rows with the live total in the heading", async () => {
    mockLeagues({ data: buildReply([buildLeague()], 16) });

    renderPage();

    const table = within(await screen.findByRole("table", { name: "Leagues" }));

    expect(screen.getByText("16 leagues")).toBeTruthy();
    expect(table.getByText("Major League Soccer")).toBeTruthy();
    expect(table.getByText("Football")).toBeTruthy();
  });

  it("numbers rows from the current offset", async () => {
    mockLeagues({ data: buildReply([buildLeague()], 60) });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Next" }));

    expect(await screen.findByText("26")).toBeTruthy();
  });

  it("shows three key athletes and hides the rest behind a labelled overflow", async () => {
    const keyAthletes = [1, 2, 3, 4, 5].map((id) => ({
      id,
      name: `Athlete ${String(id)}`,
    }));

    mockLeagues({ data: buildReply([buildLeague({ keyAthletes })]) });

    renderPage();

    expect(await screen.findByText("Athlete 3")).toBeTruthy();
    expect(screen.queryByText("Athlete 4")).toBeNull();
    expect(screen.getByText("+2")).toBeTruthy();
    expect(screen.getByText("Athlete 4, Athlete 5")).toBeTruthy();
  });

  it("lists the first nationalities inline and counts the remainder", async () => {
    mockLeagues({
      data: buildReply([
        buildLeague({
          nationalities: ["Brazil", "France", "Ghana", "Japan", "Spain"],
        }),
      ]),
    });

    renderPage();

    expect(await screen.findByText("Brazil, France, Ghana")).toBeTruthy();
    expect(screen.getByText("+2")).toBeTruthy();
    expect(screen.getByText("Japan, Spain")).toBeTruthy();
  });

  it("marks only the league column as sorted", async () => {
    mockLeagues({ data: buildReply() });

    renderPage();

    const headers = within(
      await screen.findByRole("table", { name: "Leagues" }),
    ).getAllByRole("columnheader");
    const sortStates = headers.map((header) =>
      header.getAttribute("aria-sort"),
    );

    expect(sortStates).toEqual([null, "ascending", null, null]);
  });
});
