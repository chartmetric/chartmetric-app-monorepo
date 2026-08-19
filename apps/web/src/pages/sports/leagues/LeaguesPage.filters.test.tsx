import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { messages as enSports } from "../../../locales/sports/en/messages.po";
import { LeaguesPage } from "./LeaguesPage";
import {
  buildReply,
  DEFAULT_QUERY,
  FILTER_OPTIONS,
} from "./LeaguesPage.test.helpers";

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock("../../../api/client", () => ({
  apiClient: { GET: apiGetMock },
}));

const mockSuccessfulRequests = (): void => {
  apiGetMock.mockImplementation(async (path: string) => {
    await Promise.resolve();

    return path === "/app/leagues/filter-options"
      ? { data: FILTER_OPTIONS }
      : { data: buildReply() };
  });
};

const expectQuery = async (query: Record<string, unknown>): Promise<void> => {
  await waitFor(() => {
    expect(apiGetMock).toHaveBeenCalledWith("/app/leagues", {
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
          <LeaguesPage />
        </MantineProvider>
      </QueryClientProvider>
    </I18nProvider>,
  );
};

const clickPill = async (name: string): Promise<void> => {
  fireEvent.click(await screen.findByRole("button", { name }));
};

describe("LeaguesPage filters", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    i18n.load("en", enSports);
    i18n.activate("en");
    mockSuccessfulRequests();
  });

  it("requests the default page before any filter is touched", async () => {
    renderPage();

    await expectQuery(DEFAULT_QUERY);
  });

  it("maps a sport pill to sports[] and clears it from All Sports", async () => {
    renderPage();

    await clickPill("Football");
    await expectQuery({ ...DEFAULT_QUERY, sports: ["Football"] });

    await clickPill("All Sports");
    await expectQuery(DEFAULT_QUERY);
  });

  it("keeps one sport selected at a time", async () => {
    renderPage();

    await clickPill("Football");
    await expectQuery({ ...DEFAULT_QUERY, sports: ["Football"] });

    await clickPill("Basketball");
    await expectQuery({ ...DEFAULT_QUERY, sports: ["Basketball"] });
  });

  it("maps the tracked-athlete pills and replaces rather than accumulates", async () => {
    renderPage();

    await clickPill("5+");
    await expectQuery({ ...DEFAULT_QUERY, minTrackedAthletes: 5 });

    await clickPill("10+");
    await expectQuery({ ...DEFAULT_QUERY, minTrackedAthletes: 10 });
  });

  it("clears a threshold pill when the active one is clicked again", async () => {
    renderPage();

    await clickPill("2+");
    await expectQuery({ ...DEFAULT_QUERY, minTrackedAthletes: 2 });

    await clickPill("2+");
    await expectQuery(DEFAULT_QUERY);
  });

  it("maps the reach pills to minAggregatedIgFollowers", async () => {
    renderPage();

    await clickPill("10M+");
    await expectQuery({
      ...DEFAULT_QUERY,
      minAggregatedIgFollowers: 10_000_000,
    });
  });

  // Both groups render a "10+"-shaped label, so the two thresholds must stay on
  // separate query keys rather than one overwriting the other.
  it("tracks the athlete and reach thresholds independently", async () => {
    renderPage();

    await clickPill("10+");
    await clickPill("1M+");

    await expectQuery({
      ...DEFAULT_QUERY,
      minAggregatedIgFollowers: 1_000_000,
      minTrackedAthletes: 10,
    });
  });

  it("maps the mega toggle to megaOnly", async () => {
    renderPage();

    await clickPill("Mega only");
    await expectQuery({ ...DEFAULT_QUERY, megaOnly: true });
  });

  it("maps the search field to name and trims it", async () => {
    renderPage();

    fireEvent.change(
      await screen.findByRole("textbox", { name: "Search by league name" }),
      { target: { value: "  premier  " } },
    );

    await expectQuery({ ...DEFAULT_QUERY, name: "premier" });
  });

  it("resets the offset when a filter changes after paging", async () => {
    apiGetMock.mockImplementation(async (path: string) => {
      await Promise.resolve();

      return path === "/app/leagues/filter-options"
        ? { data: FILTER_OPTIONS }
        : { data: buildReply(undefined, 60) };
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Next" }));
    await expectQuery({ ...DEFAULT_QUERY, offset: 25 });

    await clickPill("Mega only");
    await expectQuery({ ...DEFAULT_QUERY, megaOnly: true, offset: 0 });
  });
});
