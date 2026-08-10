import { i18n } from "@lingui/core";
import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Actor } from "./api/types";

import { messages as enTv } from "../../../locales/tv/en/messages.po";
import {
  actorsReply,
  bodyRowCell,
  buildActor,
  columnHeaderTexts,
  findActorsTable,
  MOANA_CREDIT,
  renderActorsPage,
} from "./ActorsPage.test.helpers";

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock("../../../api/client", () => ({
  apiClient: { GET: apiGetMock },
}));

const EMPTY_CELL = "—";

const KNOWN_FOR_CELL = 2;
const INSTAGRAM_CELL = 3;
const FOLLOWERS_CELL = 4;
const ROLES_CELL = 5;
const POPULARITY_CELL = 6;

const renderWith = async (overrides: Partial<Actor> = {}): Promise<void> => {
  apiGetMock.mockImplementation(async () => {
    await Promise.resolve();

    return actorsReply([buildActor(overrides)], {
      limit: 25,
      offset: 0,
      total: 1,
    });
  });

  renderActorsPage();
  await findActorsTable();
};

describe("ActorsPage columns", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    i18n.load("en", enTv);
    i18n.activate("en");
  });

  it("renders the seven columns in the specified order", async () => {
    await renderWith();

    expect(columnHeaderTexts()).toEqual([
      "Index",
      "Actor name↕",
      "Known for",
      "Instagram",
      "IG Followers↓",
      "Roles↕",
      "Popularity↕",
    ]);
  });

  it("links the actor name to its detail route", async () => {
    await renderWith();

    const link = screen.getByRole("link", { name: "Dwayne Johnson" });

    expect(link.getAttribute("href")).toBe("/tv/actors/18918");
    expect(screen.getByAltText("Dwayne Johnson")).toBeDefined();
  });

  it("renders both known-for credits linked to their titles", async () => {
    await renderWith();

    const moana = screen.getByRole("link", { name: "Moana as Maui" });
    const ballers = screen.getByRole("link", {
      name: "Ballers as Spencer Strasmore",
    });

    expect(moana.getAttribute("href")).toBe("/tv/titles/1108427");
    expect(ballers.getAttribute("href")).toBe("/tv/titles/62704");
  });

  it("drops the character fragment when a credit has no character", async () => {
    await renderWith({ knownFor: [{ ...MOANA_CREDIT, character: "  " }] });

    const link = screen.getByRole("link", { name: "Moana" });

    expect(link.getAttribute("href")).toBe("/tv/titles/1108427");
    expect(screen.queryByText(/ as /u)).toBeNull();
  });

  it("shows the empty cell when an actor has no known-for credits", async () => {
    await renderWith({ knownFor: [] });

    expect(bodyRowCell(0, KNOWN_FOR_CELL).textContent).toBe(EMPTY_CELL);
  });

  it("opens the Instagram handle as a safe external link", async () => {
    await renderWith();

    const link = screen.getByRole("link", {
      name: "Instagram profile @therock",
    });

    expect(link.getAttribute("href")).toBe("https://instagram.com/therock");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.textContent).toBe("@therock");
  });

  it("does not double the handle prefix when the API already sent one", async () => {
    await renderWith({ instagramHandle: "@therock" });

    expect(bodyRowCell(0, INSTAGRAM_CELL).textContent).toBe("@therock");
  });

  it("shows the handle as plain text when no profile URL exists", async () => {
    await renderWith({ instagramUrl: null });

    const cell = bodyRowCell(0, INSTAGRAM_CELL);

    expect(cell.textContent).toBe("@therock");
    expect(within(cell).queryByRole("link")).toBeNull();
  });

  it("shows the empty cell when an actor has no Instagram account", async () => {
    await renderWith({ instagramHandle: null, instagramUrl: null });

    expect(bodyRowCell(0, INSTAGRAM_CELL).textContent).toBe(EMPTY_CELL);
  });

  it("abbreviates follower counts and fixes popularity to one decimal", async () => {
    await renderWith({ popularity: 7 });

    expect(bodyRowCell(0, FOLLOWERS_CELL).textContent).toBe("382.3M");
    expect(bodyRowCell(0, ROLES_CELL).textContent).toBe("2");
    expect(bodyRowCell(0, POPULARITY_CELL).textContent).toBe("7.0");
  });

  it("formats a five-figure role count for the active locale", async () => {
    await renderWith({ roleCount: 12_345 });

    expect(bodyRowCell(0, ROLES_CELL).textContent).toBe("12,345");
  });

  it("shows the empty cell for a missing follower count", async () => {
    await renderWith({ instagramFollowers: null });

    expect(bodyRowCell(0, FOLLOWERS_CELL).textContent).toBe(EMPTY_CELL);
  });

  it("scrolls the wide table inside its own container", async () => {
    await renderWith();

    const table = await findActorsTable();
    const scroller = table.closest<HTMLElement>("[style*='--table-min-width']");

    expect(scroller).not.toBeNull();
    expect(scroller?.style.getPropertyValue("--table-min-width")).toContain(
      "64rem",
    );
  });
});
