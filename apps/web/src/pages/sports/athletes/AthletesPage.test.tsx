import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { messages as enSports } from "../../../locales/sports/en/messages.po";
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
    apiGetMock.mockResolvedValue({
      data: { data: [athlete], meta: { limit: 25, offset: 0 } },
    });

    renderPage();

    expect(screen.getByRole("status")).toBeDefined();
    expect(await screen.findByText("Alex Morgan")).toBeDefined();
    expect(screen.getByText("Football")).toBeDefined();
    expect(screen.getByText("United States")).toBeDefined();
    expect(screen.getByText("87.4")).toBeDefined();
    expect(
      screen.getByRole("textbox", { name: "Search by name" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Sort by CM score" }),
    ).toBeDefined();
  });

  it("renders an empty state", async () => {
    apiGetMock.mockResolvedValue({
      data: { data: [], meta: { limit: 25, offset: 0 } },
    });

    renderPage();

    expect(await screen.findByText("No athletes found")).toBeDefined();
  });

  it("renders an error state and retries", async () => {
    apiGetMock
      .mockResolvedValueOnce({ error: { message: "failed" } })
      .mockResolvedValueOnce({
        data: { data: [athlete], meta: { limit: 25, offset: 0 } },
      });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Alex Morgan")).toBeDefined();
    expect(apiGetMock).toHaveBeenCalledTimes(2);
  });

  it("requests the next page with its offset", async () => {
    apiGetMock.mockResolvedValue({
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
      expect(apiGetMock).toHaveBeenLastCalledWith("/app/athletes", {
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
    apiGetMock
      .mockResolvedValueOnce({
        data: {
          data: Array.from({ length: 25 }, (_, index) => ({
            ...athlete,
            id: index + 1,
            name: `Athlete ${String(index + 1)}`,
          })),
          meta: { limit: 25, offset: 0 },
        },
      })
      .mockResolvedValueOnce({
        data: { data: [], meta: { limit: 25, offset: 25 } },
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

  it("applies filters and changes server-side sorting", async () => {
    apiGetMock.mockResolvedValue({
      data: { data: [athlete], meta: { limit: 25, offset: 0 } },
    });

    renderPage();

    fireEvent.change(
      await screen.findByRole("textbox", { name: "Search by name" }),
      { target: { value: "  Alex  " } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenLastCalledWith("/app/athletes", {
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
      expect(apiGetMock).toHaveBeenLastCalledWith("/app/athletes", {
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

  it("validates the CM score range before requesting", async () => {
    apiGetMock.mockResolvedValue({
      data: { data: [athlete], meta: { limit: 25, offset: 0 } },
    });

    renderPage();

    fireEvent.change(
      await screen.findByRole("textbox", { name: "Minimum CM score" }),
      { target: { value: "90" } },
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Maximum CM score" }),
      { target: { value: "10" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(
      await screen.findByText(
        "Maximum CM score must be greater than or equal to the minimum.",
      ),
    ).toBeDefined();
    expect(apiGetMock).toHaveBeenCalledTimes(1);
  });
});
