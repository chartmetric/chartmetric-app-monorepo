import { i18n } from "@lingui/core";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { messages as enTv } from "../../../locales/tv/en/messages.po";
import {
  ACTORS_PATH,
  actorsReply,
  bodyRowCells,
  buildActor,
  buildActorPage,
  busyStateOf,
  clickEnabledButton,
  DEFAULT_ACTORS_QUERY,
  expectActorsQuery,
  findActorsTable,
  renderActorsPage,
} from "./ActorsPage.test.helpers";

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock("../../../api/client", () => ({
  apiClient: { GET: apiGetMock },
}));

interface ActorRequest {
  params: { query: { offset: number } };
}

const PAGE_SIZE = 25;

const mockSinglePage = (): void => {
  apiGetMock.mockImplementation(async () => {
    await Promise.resolve();

    return actorsReply([buildActor()], {
      limit: PAGE_SIZE,
      offset: 0,
      total: 1,
    });
  });
};

const mockPagedActors = (total: number): void => {
  apiGetMock.mockImplementation(
    async (_path: string, request: ActorRequest) => {
      await Promise.resolve();

      const { offset } = request.params.query;

      return actorsReply(
        buildActorPage(Math.min(PAGE_SIZE, total - offset), offset),
        { limit: PAGE_SIZE, offset, total },
      );
    },
  );
};

const goToNextPage = async (): Promise<void> => {
  await clickEnabledButton("Next");
};

describe("ActorsPage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    i18n.load("en", enTv);
    i18n.activate("en");
  });

  it("requests the first page sorted by Instagram followers descending", async () => {
    mockSinglePage();

    renderActorsPage();

    await expectActorsQuery(apiGetMock, DEFAULT_ACTORS_QUERY);
    expect(await findActorsTable()).toBeDefined();
  });

  it("announces loading before the first page arrives", async () => {
    mockSinglePage();

    renderActorsPage();

    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByLabelText("Loading actors")).toBeDefined();
    expect(await screen.findByText("Dwayne Johnson")).toBeDefined();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("numbers rows by their absolute position on the first page", async () => {
    mockPagedActors(60);

    renderActorsPage();

    await findActorsTable();

    expect(bodyRowCells(0)[0]?.textContent).toBe("1");
    expect(bodyRowCells(24)[0]?.textContent).toBe("25");
  });

  it("continues absolute numbering onto the next page", async () => {
    mockPagedActors(60);

    renderActorsPage();

    await goToNextPage();

    await expectActorsQuery(apiGetMock, {
      ...DEFAULT_ACTORS_QUERY,
      offset: 25,
    });
    await waitFor(() => {
      expect(bodyRowCells(0)[0]?.textContent).toBe("26");
    });
    expect(bodyRowCells(24)[0]?.textContent).toBe("50");
  });

  it("walks back to the first page", async () => {
    mockPagedActors(60);

    renderActorsPage();

    await goToNextPage();
    await waitFor(() => {
      expect(screen.getByText("Page 2 of 3")).toBeDefined();
    });

    await clickEnabledButton("Previous");

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 3")).toBeDefined();
    });
    expect(bodyRowCells(0)[0]?.textContent).toBe("1");
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Previous" })
        .disabled,
    ).toBe(true);
  });

  it("reports the page range and stops at the last page", async () => {
    mockPagedActors(60);

    renderActorsPage();

    await goToNextPage();
    await waitFor(() => {
      expect(screen.getByText("Showing 26–50 of 60 actors")).toBeDefined();
    });

    await goToNextPage();

    expect(await screen.findByText("Showing 51–60 of 60 actors")).toBeDefined();
    await waitFor(() => {
      expect(
        screen.getByRole<HTMLButtonElement>("button", { name: "Next" })
          .disabled,
      ).toBe(true);
    });
  });

  it("reverses Instagram follower sorting on a second click", async () => {
    mockSinglePage();

    renderActorsPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Sort by IG Followers" }),
    );

    await expectActorsQuery(apiGetMock, {
      ...DEFAULT_ACTORS_QUERY,
      sortDirection: "asc",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Sort by IG Followers" }),
    );

    await expectActorsQuery(apiGetMock, DEFAULT_ACTORS_QUERY);
  });

  it("marks the active sort column for assistive technology", async () => {
    mockSinglePage();

    renderActorsPage();

    const table = await findActorsTable();

    expect(
      within(table)
        .getByRole("columnheader", { name: /IG Followers/u })
        .getAttribute("aria-sort"),
    ).toBe("descending");
    expect(
      within(table)
        .getByRole("columnheader", { name: /Actor name/u })
        .getAttribute("aria-sort"),
    ).toBe("none");
  });

  it("sorts the actor name ascending first and resets the offset", async () => {
    mockPagedActors(60);

    renderActorsPage();

    await goToNextPage();
    await expectActorsQuery(apiGetMock, {
      ...DEFAULT_ACTORS_QUERY,
      offset: 25,
    });

    fireEvent.click(screen.getByRole("button", { name: "Sort by Actor name" }));

    await expectActorsQuery(apiGetMock, {
      limit: 25,
      offset: 0,
      sortBy: "name",
      sortDirection: "asc",
    });
  });

  it("sorts Roles and Popularity through the API", async () => {
    mockSinglePage();

    renderActorsPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Sort by Roles" }),
    );

    await expectActorsQuery(apiGetMock, {
      limit: 25,
      offset: 0,
      sortBy: "roleCount",
      sortDirection: "desc",
    });

    fireEvent.click(screen.getByRole("button", { name: "Sort by Popularity" }));

    await expectActorsQuery(apiGetMock, {
      limit: 25,
      offset: 0,
      sortBy: "popularity",
      sortDirection: "desc",
    });
  });

  it("renders an empty state when no actors match", async () => {
    apiGetMock.mockImplementation(async () => {
      await Promise.resolve();

      return actorsReply([], { limit: PAGE_SIZE, offset: 0, total: 0 });
    });

    renderActorsPage();

    expect(await screen.findByText("No actors found")).toBeDefined();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("renders an error state and recovers on retry", async () => {
    let attempts = 0;

    apiGetMock.mockImplementation(async () => {
      await Promise.resolve();
      attempts += 1;

      return attempts === 1
        ? { error: { message: "failed" } }
        : actorsReply([buildActor()], {
            limit: PAGE_SIZE,
            offset: 0,
            total: 1,
          });
    });

    renderActorsPage();

    expect(await screen.findByText("Unable to load actors")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Dwayne Johnson")).toBeDefined();
    expect(attempts).toBe(2);
  });

  it("keeps the previous page visible and busy while the next one loads", async () => {
    const pending = new Map<number, () => void>();

    apiGetMock.mockImplementation(
      async (_path: string, request: ActorRequest) => {
        const { offset } = request.params.query;
        if (offset > 0) {
          await new Promise<void>((resolve) => {
            pending.set(offset, resolve);
          });
        }

        return actorsReply(buildActorPage(PAGE_SIZE, offset), {
          limit: PAGE_SIZE,
          offset,
          total: 60,
        });
      },
    );

    renderActorsPage();

    await goToNextPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Updating actors")).toBeDefined();
    });
    expect(screen.getByText("Actor 1")).toBeDefined();
    expect(busyStateOf(await findActorsTable())).toBe("true");

    pending.get(25)?.();

    await waitFor(() => {
      expect(screen.getByText("Actor 26")).toBeDefined();
    });
    expect(busyStateOf(await findActorsTable())).toBe("false");
  });

  it("reaches the list through the first-party app surface", async () => {
    mockSinglePage();

    renderActorsPage();

    await findActorsTable();

    expect(apiGetMock.mock.calls.every(([path]) => path === ACTORS_PATH)).toBe(
      true,
    );
  });
});
