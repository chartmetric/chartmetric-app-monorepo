import { i18n } from "@lingui/core";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Influencer, InfluencerFilterOptionsReply } from "../types";

import { messages as enCreators } from "../../../../locales/creators/en/messages.po";
import {
  findEnabledControl,
  getControlledOption,
  makeReply,
  renderInfluencersPage as renderPage,
} from "./influencers-page.test.helpers";

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../api/client", () => ({
  apiClient: { GET: apiGetMock },
}));

const influencer: Influencer = {
  ageGroup: "25-34",
  categories: ["Beauty", "Lifestyle"],
  city: "Los Angeles",
  country: "US",
  gender: "female",
  id: 4821,
  instagramHandle: "chiara",
  name: "Chiara Ferragni",
  subtags: ["Makeup", "Fashion"],
  tiktokHandle: "chiaraf",
  youtubeHandle: null,
};

const filterOptions: InfluencerFilterOptionsReply = {
  ageGroups: [
    { count: 40, value: "18-" },
    { count: 120, value: "18-24" },
    { count: 90, value: "25-34" },
    { count: 30, value: "35-44" },
    { count: 10, value: "45-64" },
    { count: 5, value: "65+" },
  ],
  categories: [
    { count: 50, value: "Beauty" },
    { count: 20, value: "Business & Careers" },
  ],
  countries: [
    { count: 12, value: "US" },
    { count: 5, value: "KR" },
  ],
  genders: [
    { count: 30, value: "female" },
    { count: 25, value: "male" },
  ],
};

const mockRequests = (listReply = makeReply([influencer])): void => {
  apiGetMock.mockImplementation(async (path: string) => {
    await Promise.resolve();

    return path === "/app/influencers/filter-options"
      ? { data: filterOptions }
      : { data: listReply };
  });
};

const expectedQuery = (
  filters: Record<string, unknown>,
): Record<string, unknown> => ({ limit: 25, offset: 0, ...filters });

const expectInfluencerQuery = async (
  filters: Record<string, unknown>,
): Promise<void> => {
  await waitFor(() => {
    expect(apiGetMock).toHaveBeenCalledWith("/app/influencers", {
      params: { query: expectedQuery(filters) },
    });
  });
};

describe("InfluencersPage filters", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    i18n.load("en", enCreators);
    i18n.activate("en");
  });

  it("applies a category selection from the inline filter bar", async () => {
    mockRequests();

    renderPage();
    await screen.findByText("Chiara Ferragni");

    const categoryControl = await findEnabledControl("combobox", "Category");
    fireEvent.click(categoryControl);
    fireEvent.click(getControlledOption(categoryControl, /Beauty/));

    await expectInfluencerQuery({ categories: ["Beauty"] });
  });

  it("applies country and age filters from the drawer, sending codes not names", async () => {
    mockRequests();

    renderPage();
    await screen.findByText("Chiara Ferragni");

    fireEvent.click(screen.getByRole("button", { name: "All filters" }));
    const drawer = await screen.findByRole("dialog");

    fireEvent.click(
      within(drawer).getByRole("checkbox", { name: /South Korea/ }),
    );
    await expectInfluencerQuery({ countries: ["KR"] });

    fireEvent.click(within(drawer).getByRole("checkbox", { name: /Under 18/ }));
    await expectInfluencerQuery({ ageGroups: ["18-"], countries: ["KR"] });
  });

  it("combines included and excluded countries", async () => {
    mockRequests();

    renderPage();
    await screen.findByText("Chiara Ferragni");

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

    await expectInfluencerQuery({
      countries: ["KR"],
      excludeCountries: ["US"],
    });
  });

  it("searches influencers by handle with debounced keystrokes", async () => {
    mockRequests();

    renderPage();
    await screen.findByText("Chiara Ferragni");

    const search = screen.getByRole<HTMLInputElement>("textbox", {
      name: "Search by handle",
    });
    fireEvent.change(search, { target: { value: "chi" } });
    fireEvent.change(search, { target: { value: "  chiara  " } });

    expect(search.value).toBe("  chiara  ");

    await waitFor(
      () => {
        expect(apiGetMock).toHaveBeenCalledWith("/app/influencers", {
          params: { query: expectedQuery({ handle: "chiara" }) },
        });
      },
      { timeout: 3000 },
    );
    expect(apiGetMock).not.toHaveBeenCalledWith("/app/influencers", {
      params: { query: expectedQuery({ handle: "chi" }) },
    });
  });

  it("debounces rapid filter changes into a single query", async () => {
    mockRequests();

    renderPage();
    await screen.findByText("Chiara Ferragni");

    const categoryControl = await findEnabledControl("combobox", "Category");
    fireEvent.click(categoryControl);
    fireEvent.click(getControlledOption(categoryControl, /Beauty/));
    fireEvent.click(getControlledOption(categoryControl, /Business & Careers/));

    await expectInfluencerQuery({
      categories: ["Beauty", "Business & Careers"],
    });
    expect(apiGetMock).not.toHaveBeenCalledWith("/app/influencers", {
      params: { query: expectedQuery({ categories: ["Beauty"] }) },
    });
  });

  it("resets the offset to zero when a filter is applied", async () => {
    mockRequests(
      makeReply(
        Array.from({ length: 25 }, (_, index) => ({
          ...influencer,
          id: index + 1,
          name: `Influencer ${String(index + 1)}`,
        })),
        60,
      ),
    );

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/influencers", {
        params: { query: { limit: 25, offset: 25 } },
      });
    });

    const categoryControl = await findEnabledControl("combobox", "Category");
    fireEvent.click(categoryControl);
    fireEvent.click(getControlledOption(categoryControl, /Beauty/));

    await expectInfluencerQuery({ categories: ["Beauty"] });
  });

  it("clears every filter at once", async () => {
    mockRequests();

    renderPage();
    await screen.findByText("Chiara Ferragni");

    const search = screen.getByRole<HTMLInputElement>("textbox", {
      name: "Search by handle",
    });
    fireEvent.change(search, { target: { value: "chiara" } });
    const categoryControl = await findEnabledControl("combobox", "Category");
    fireEvent.click(categoryControl);
    fireEvent.click(getControlledOption(categoryControl, /Beauty/));

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    await expectInfluencerQuery({});
    await waitFor(() => {
      expect(
        screen.getByRole<HTMLInputElement>("textbox", {
          name: "Search by handle",
        }).value,
      ).toBe("");
    });
  });

  it("degrades to a dismissible warning when filter options fail", async () => {
    apiGetMock.mockImplementation(async (path: string) => {
      await Promise.resolve();

      return path === "/app/influencers/filter-options"
        ? { error: { message: "failed" } }
        : { data: makeReply([influencer]) };
    });

    renderPage();

    expect(await screen.findByText("Chiara Ferragni")).toBeDefined();
    expect(screen.getByText("Unable to load filter options")).toBeDefined();
    expect(screen.getByRole("combobox", { name: "Category" })).toHaveProperty(
      "disabled",
      true,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss filter warning" }),
    );

    await waitFor(() => {
      expect(screen.queryByText("Unable to load filter options")).toBeNull();
    });
    expect(screen.getByText("Chiara Ferragni")).toBeDefined();
  });
});
