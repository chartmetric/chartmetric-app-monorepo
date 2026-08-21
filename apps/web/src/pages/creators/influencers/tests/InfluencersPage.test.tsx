import { i18n } from "@lingui/core";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Influencer, InfluencerListReply } from "../types";

import { messages as enCreators } from "../../../../locales/creators/en/messages.po";
import {
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

type MockReply = { data: InfluencerListReply } | { error: { message: string } };

const mockInfluencerRequest = (reply?: MockReply): void => {
  const resolved: MockReply = reply ?? { data: makeReply([influencer]) };
  apiGetMock.mockImplementation(async () => {
    await Promise.resolve();
    return resolved;
  });
};

describe("InfluencersPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    i18n.load("en", enCreators);
    i18n.activate("en");
  });

  it("renders loading then influencer data from the generated client", async () => {
    mockInfluencerRequest();

    renderPage();

    expect(screen.getByRole("status")).toBeDefined();
    expect(await screen.findByText("Chiara Ferragni")).toBeDefined();

    const table = screen.getByRole("table", { name: "Influencers" });
    expect(within(table).getByText("Beauty")).toBeDefined();
    expect(within(table).getByText("Makeup")).toBeDefined();
    expect(within(table).getByText("@chiara")).toBeDefined();
    expect(within(table).getByText("@chiaraf")).toBeDefined();
    expect(within(table).getByText("Female")).toBeDefined();
    expect(within(table).getByText("25-34")).toBeDefined();
  });

  it("renders the country name for the active locale with the city", async () => {
    mockInfluencerRequest();

    renderPage();

    const table = await screen.findByRole("table", { name: "Influencers" });
    expect(within(table).getByText("United States")).toBeDefined();
    expect(within(table).getByText("Los Angeles")).toBeDefined();
  });

  it("labels the under-18 age bucket and omits absent handles", async () => {
    mockInfluencerRequest({
      data: makeReply([
        {
          ...influencer,
          ageGroup: "18-",
          tiktokHandle: null,
          youtubeHandle: null,
        },
      ]),
    });

    renderPage();

    const table = await screen.findByRole("table", { name: "Influencers" });
    expect(within(table).getByText("Under 18")).toBeDefined();
    expect(within(table).getByText("@chiara")).toBeDefined();
    expect(within(table).queryByText("@chiaraf")).toBeNull();
  });

  it("shows a placeholder for missing gender, location and tags", async () => {
    mockInfluencerRequest({
      data: makeReply([
        {
          ...influencer,
          ageGroup: null,
          categories: [],
          city: null,
          country: null,
          gender: null,
          subtags: [],
        },
      ]),
    });

    renderPage();

    const table = await screen.findByRole("table", { name: "Influencers" });
    const row = within(table).getByText("Chiara Ferragni").closest("tr");
    if (row === null) throw new Error("missing influencer row");
    expect(within(row).getAllByText("—")).toHaveLength(5);
  });

  it("shows the result count from the reply total", async () => {
    mockInfluencerRequest({ data: makeReply([influencer], 1342) });

    renderPage();

    expect(await screen.findByText("1,342 influencers")).toBeDefined();
  });

  it("renders an empty state", async () => {
    mockInfluencerRequest({ data: makeReply([], 0) });

    renderPage();

    expect(await screen.findByText("No influencers found")).toBeDefined();
  });

  it("renders an error state and retries", async () => {
    let requestCount = 0;
    apiGetMock.mockImplementation(async () => {
      await Promise.resolve();
      requestCount += 1;
      return requestCount === 1
        ? { error: { message: "failed" } }
        : { data: makeReply([influencer]) };
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Chiara Ferragni")).toBeDefined();
    expect(requestCount).toBe(2);
  });

  it("requests the next page with its offset and shows the page of count", async () => {
    mockInfluencerRequest({
      data: makeReply(
        Array.from({ length: 25 }, (_, index) => ({
          ...influencer,
          id: index + 1,
          name: `Influencer ${String(index + 1)}`,
        })),
        60,
      ),
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/app/influencers", {
        params: { query: { limit: 25, offset: 25 } },
      });
    });
    expect(await screen.findByText("Page 2 of 3")).toBeDefined();
  });
});
