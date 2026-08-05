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
import {
  findEnabledControl,
  getControlledOption,
  getControlledRadio,
} from "./athlete-filter.test.helpers";
import { AthletesPage } from "./AthletesPage";

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock("../../../api/client", () => ({
  apiClient: { GET: apiGetMock },
}));

const athlete = {
  cmScore: 87.4,
  id: 42,
  imageUrl: "https://img/athlete-42.jpg",
  name: "Alex Morgan",
  nationality: "United States",
  sport: "Football",
  type: "athlete",
};

const filterOptions = {
  cmScore: { max: 99.4, min: 12.5 },
  nationalities: [{ count: 1, value: "United States" }],
  sports: [
    { count: 2, value: "Football" },
    { count: 1, value: "Tennis" },
  ],
  types: [{ count: 3, value: "athlete" }],
};

const athleteListReply = {
  data: { data: [athlete], meta: { limit: 25, offset: 0 } },
};

const mockSuccessfulRequests = (listReply = athleteListReply): void => {
  apiGetMock.mockImplementation(async (path: string) => {
    await Promise.resolve();

    return path === "/app/athletes/filter-options"
      ? { data: filterOptions }
      : listReply;
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
    i18n.load("en", enSports);
    i18n.activate("en");
  });

  it("renders loading and athlete data from the generated client", async () => {
    mockSuccessfulRequests();

    renderPage();

    expect(screen.getByRole("status")).toBeDefined();
    expect(await screen.findByText("Alex Morgan")).toBeDefined();
    const table = screen.getByRole("table", { name: "Athletes" });
    expect(within(table).getByText("Football")).toBeDefined();
    expect(within(table).getByText("United States")).toBeDefined();
    expect(within(table).getByText("87.4")).toBeDefined();
    expect(
      screen.getByRole("textbox", { name: "Search by name" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Sort by CM score" }),
    ).toBeDefined();
  });

  it("renders an empty state", async () => {
    mockSuccessfulRequests({
      data: { data: [], meta: { limit: 25, offset: 0 } },
    });

    renderPage();

    expect(await screen.findByText("No athletes found")).toBeDefined();
  });

  it("renders an error state and retries", async () => {
    let athleteRequestCount = 0;
    apiGetMock.mockImplementation(async (path: string) => {
      await Promise.resolve();

      if (path === "/app/athletes/filter-options") {
        return { data: filterOptions };
      }

      athleteRequestCount += 1;

      return athleteRequestCount === 1
        ? { error: { message: "failed" } }
        : athleteListReply;
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Alex Morgan")).toBeDefined();
    expect(athleteRequestCount).toBe(2);
  });

  it("requests the next page with its offset", async () => {
    mockSuccessfulRequests({
      data: {
        data: Array.from({ length: 25 }, (_, index) => ({
          ...athlete,
          id: index + 1,
          name: `Athlete ${String(index + 1)}`,
        })),
        meta: { limit: 25, offset: 0 },
      },
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/athletes", {
        params: {
          query: {
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

  it("keeps previous-page navigation when a later page is empty", async () => {
    let athleteRequestCount = 0;
    apiGetMock.mockImplementation(async (path: string) => {
      await Promise.resolve();

      if (path === "/app/athletes/filter-options") {
        return { data: filterOptions };
      }

      athleteRequestCount += 1;

      return athleteRequestCount === 1
        ? {
            data: {
              data: Array.from({ length: 25 }, (_, index) => ({
                ...athlete,
                id: index + 1,
                name: `Athlete ${String(index + 1)}`,
              })),
              meta: { limit: 25, offset: 0 },
            },
          }
        : { data: { data: [], meta: { limit: 25, offset: 25 } } };
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Next" }));

    expect(await screen.findByText("Page 2")).toBeDefined();
    await waitFor(() => {
      expect(
        screen.getByRole<HTMLButtonElement>("button", { name: "Previous" })
          .disabled,
      ).toBe(false);
    });
  });

  it("applies name changes automatically and changes server-side sorting", async () => {
    mockSuccessfulRequests();

    renderPage();

    fireEvent.change(
      await screen.findByRole("textbox", { name: "Search by name" }),
      { target: { value: "  Alex  " } },
    );

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/athletes", {
        params: {
          query: {
            limit: 25,
            name: "Alex",
            offset: 0,
            sortBy: "cmScore",
            sortDirection: "desc",
          },
        },
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Sort by Athlete" }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/athletes", {
        params: {
          query: {
            limit: 25,
            name: "Alex",
            offset: 0,
            sortBy: "name",
            sortDirection: "asc",
          },
        },
      });
    });
  });

  it("applies category selection, exclusion, and removal automatically", async () => {
    mockSuccessfulRequests();

    renderPage();

    let sportFilter = await findEnabledControl("combobox", "Sport");
    fireEvent.click(sportFilter);
    fireEvent.click(getControlledOption(sportFilter, /Football/u));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/athletes", {
        params: {
          query: {
            limit: 25,
            offset: 0,
            sortBy: "cmScore",
            sortDirection: "desc",
            sports: ["Football"],
          },
        },
      });
    });

    fireEvent.click(getControlledRadio(sportFilter, "Exclude"));
    fireEvent.click(getControlledOption(sportFilter, /Tennis/u));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/athletes", {
        params: {
          query: {
            excludeSports: ["Tennis"],
            limit: 25,
            offset: 0,
            sortBy: "cmScore",
            sortDirection: "desc",
            sports: ["Football"],
          },
        },
      });
    });

    sportFilter = screen.getByRole<HTMLButtonElement>("combobox", {
      name: "Sport",
    });
    fireEvent.click(getControlledRadio(sportFilter, "Include"));
    fireEvent.click(getControlledOption(sportFilter, /Football/u));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/athletes", {
        params: {
          query: {
            excludeSports: ["Tennis"],
            limit: 25,
            offset: 0,
            sortBy: "cmScore",
            sortDirection: "desc",
          },
        },
      });
    });
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
    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/athletes", {
        params: {
          query: {
            limit: 25,
            maxCmScore: 90,
            minCmScore: 70,
            offset: 0,
            sortBy: "cmScore",
            sortDirection: "desc",
          },
        },
      });
    });

    expect(screen.queryByRole("button", { name: "Apply filters" })).toBeNull();
  });
});
