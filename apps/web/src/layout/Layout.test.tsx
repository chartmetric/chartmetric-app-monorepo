import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { messages as enCommon } from "../locales/common/en/messages.po";
import { Layout } from "./Layout";

vi.mock("@propelauth/react", () => ({
  useAuthInfo: () => ({ isLoggedIn: false, loading: false }),
  useLogoutFunction: () => vi.fn(),
}));

beforeAll(() => {
  i18n.load("en", enCommon);
  i18n.activate("en");
});

const SPORTS_NAV_LABELS = [
  "Dashboard",
  "Athletes",
  "Teams",
  "Games",
  "Events",
  "Shortlists",
  "Compare",
];

const renderLayout = (
  initialPath: string,
): {
  container: HTMLElement;
  router: ReturnType<typeof createMemoryRouter>;
} => {
  const router = createMemoryRouter(
    [
      {
        children: [
          { element: <h1>Athletes page</h1>, path: "/sports/athletes" },
          { element: <h1>Dashboard page</h1>, path: "/sports/dashboard" },
          { element: <h1>Artists page</h1>, path: "/music/artists" },
        ],
        element: <Layout />,
      },
    ],
    { initialEntries: [initialPath] },
  );

  const { container } = render(
    <I18nProvider i18n={i18n}>
      <MantineProvider>
        <RouterProvider router={router} />
      </MantineProvider>
    </I18nProvider>,
  );

  return { container, router };
};

const isBurgerOpened = (burger: HTMLElement): boolean =>
  burger.querySelector("[data-opened]") !== null;

const navItem = (label: string): HTMLAnchorElement => {
  const item = screen.getByText(label).closest("a");

  if (item === null) {
    throw new Error(`No nav item rendered for ${label}`);
  }

  return item;
};

describe("Layout navigation", () => {
  it("groups the sports links under localized section headers", () => {
    renderLayout("/sports/athletes");

    const library = screen.getByRole("group", { name: "Library" });
    const discover = screen.getByRole("group", { name: "Discover" });
    const tools = screen.getByRole("group", { name: "Tools" });

    expect(library.textContent).toContain("Athletes");
    expect(discover.textContent).toBe("DiscoverTeamsGamesEvents");
    expect(tools.textContent).toBe("ToolsShortlistsCompare");
  });

  it("renders an unsectioned link above the first section header", () => {
    renderLayout("/sports/athletes");

    const dashboard = navItem("Dashboard");
    const library = screen.getByRole("group", { name: "Library" });

    expect(library.contains(dashboard)).toBe(false);
    expect(
      dashboard.compareDocumentPosition(library) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeGreaterThan(0);
  });

  it("renders a FontAwesome icon for every sports nav item", () => {
    renderLayout("/sports/athletes");

    for (const label of SPORTS_NAV_LABELS) {
      expect(navItem(label).querySelector("svg[data-icon]")).not.toBeNull();
    }
  });

  it("marks disabled items aria-disabled and does not link them", () => {
    renderLayout("/sports/athletes");

    for (const label of [
      "Dashboard",
      "Teams",
      "Games",
      "Events",
      "Shortlists",
      "Compare",
    ]) {
      const item = navItem(label);

      expect(item.getAttribute("aria-disabled")).toBe("true");
      expect(item.hasAttribute("href")).toBe(false);
      expect(screen.queryByRole("link", { name: label })).toBeNull();
    }
  });

  it("does not navigate when a disabled item is clicked", () => {
    const { router } = renderLayout("/sports/dashboard");

    fireEvent.click(navItem("Teams"));

    expect(router.state.location.pathname).toBe("/sports/dashboard");
    expect(
      screen.getByRole("heading", { name: "Dashboard page" }),
    ).toBeDefined();
  });

  it("navigates and marks the active item for an enabled link", async () => {
    const { router } = renderLayout("/sports/dashboard");

    const athletes = navItem("Athletes");

    expect(athletes.getAttribute("href")).toBe("/sports/athletes");
    expect(athletes.dataset["active"]).toBeUndefined();

    fireEvent.click(athletes);

    expect(
      await screen.findByRole("heading", { name: "Athletes page" }),
    ).toBeDefined();
    expect(router.state.location.pathname).toBe("/sports/athletes");
    expect(navItem("Athletes").dataset["active"]).toBe("true");
  });

  it("closes the collapsed navbar after navigating from a section link", async () => {
    renderLayout("/sports/dashboard");

    const [headerBurger] = screen.getAllByRole("button", {
      name: "Toggle navigation",
    });

    if (headerBurger === undefined) {
      throw new Error("No navigation burger rendered");
    }

    fireEvent.click(headerBurger);

    expect(isBurgerOpened(headerBurger)).toBe(true);

    fireEvent.click(navItem("Athletes"));

    expect(
      await screen.findByRole("heading", { name: "Athletes page" }),
    ).toBeDefined();
    expect(isBurgerOpened(headerBurger)).toBe(false);
  });

  it("renders a vertical without sections as a flat list of links", () => {
    const { container } = renderLayout("/music/artists");

    expect(screen.queryAllByRole("group")).toHaveLength(0);
    expect(screen.queryByText("Library")).toBeNull();
    expect(screen.queryByText("Discover")).toBeNull();
    expect(screen.queryByText("Tools")).toBeNull();
    expect(
      container.querySelectorAll("[class*='NavLink-section']"),
    ).toHaveLength(0);
    expect(navItem("Artists").getAttribute("href")).toBe("/music/artists");
  });
});
