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

const sortHeader = async (label: string): Promise<HTMLElement> => {
  const button = await screen.findByRole("button", {
    name: `Sort by ${label}`,
  });
  const header = button.closest("th");

  if (header === null) throw new Error(`No column header for ${label}`);

  return header;
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

  it("shows the athlete count exactly and the reach compacted", async () => {
    mockLeagues({ data: buildReply() });

    renderPage();

    const table = within(await screen.findByRole("table", { name: "Leagues" }));

    expect(table.getByText("12")).toBeTruthy();
    expect(table.getByText("12.5M")).toBeTruthy();
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

  it("caps the overflow tooltip at ten entries and counts the rest", async () => {
    const nationalities = Array.from(
      { length: 16 },
      (_, index) => `Country ${String(index + 1)}`,
    );

    mockLeagues({ data: buildReply([buildLeague({ nationalities })]) });

    renderPage();

    expect(await screen.findByText("+13")).toBeTruthy();
    expect(
      screen.getByText(
        "Country 4, Country 5, Country 6, Country 7, Country 8, Country 9, Country 10, Country 11, Country 12, Country 13",
      ),
    ).toBeTruthy();
    expect(screen.getByText("…and 3 more")).toBeTruthy();
    expect(screen.queryByText(/Country 14/u)).toBeNull();
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

  it("keeps the search in the header row beside the quick filters", async () => {
    mockLeagues({ data: buildReply() });

    renderPage();

    // Title group -> header row: the row that owns everything naming or
    // narrowing the list. A search rendered outside it is the detached corner
    // search this composition replaced.
    const title = await screen.findByRole("heading", { name: "Leagues" });
    const headerRow = title.parentElement?.parentElement;
    const search = screen.getByRole("textbox", {
      name: "Search by league name",
    });
    const sportPill = screen.getByRole("button", { name: "All Sports" });

    expect(headerRow?.contains(search)).toBe(true);
    expect(headerRow?.contains(sportPill)).toBe(true);
  });

  it("orders the columns with the numeric metrics at the right edge", async () => {
    mockLeagues({ data: buildReply() });

    renderPage();

    const headers = within(
      await screen.findByRole("table", { name: "Leagues" }),
    ).getAllByRole("columnheader");

    // The IG Reach header also carries its definition for screen readers, so
    // the label is matched at the start of the cell rather than as a whole.
    expect(headers.map((header) => header.textContent)).toEqual([
      "#",
      "League / Competition",
      "Key Athletes",
      "Nationalities",
      "Athletes",
      expect.stringMatching(/^IG Reach/u),
    ]);
  });

  it("marks the league column sorted and offers the two metric columns", async () => {
    mockLeagues({ data: buildReply() });

    renderPage();

    const headers = within(
      await screen.findByRole("table", { name: "Leagues" }),
    ).getAllByRole("columnheader");
    const sortStates = headers.map((header) =>
      header.getAttribute("aria-sort"),
    );

    expect(sortStates).toEqual([null, "ascending", null, null, "none", "none"]);
  });

  it.each(["League / Competition", "Athletes", "IG Reach"])(
    "flips the %s sort direction on every click",
    async (label) => {
      mockLeagues({ data: buildReply() });

      renderPage();

      const header = await sortHeader(label);

      fireEvent.click(within(header).getByRole("button"));
      await waitFor(() => {
        expect(header.getAttribute("aria-sort")).toBe("descending");
      });

      fireEvent.click(within(header).getByRole("button"));
      await waitFor(() => {
        expect(header.getAttribute("aria-sort")).toBe("ascending");
      });
    },
  );
});
