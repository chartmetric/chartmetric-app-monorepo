import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import { messages as enAccount } from "./locales/account/en/messages.po";
import { messages as enCommon } from "./locales/common/en/messages.po";
import { messages as esCommon } from "./locales/common/es/messages.po";
import { messages as enCreators } from "./locales/creators/en/messages.po";
import { messages as enDemo } from "./locales/demo/en/messages.po";
import { messages as esDemo } from "./locales/demo/es/messages.po";
import { messages as enMusic } from "./locales/music/en/messages.po";
import { messages as enSports } from "./locales/sports/en/messages.po";

interface MockAuthState {
  accessToken: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  user: {
    email: string;
    firstName?: string;
    lastName?: string;
    userId: string;
  } | null;
}

const auth = vi.hoisted(() => {
  const state: MockAuthState = {
    accessToken: null,
    isLoggedIn: false,
    loading: false,
    user: null,
  };
  return { logout: vi.fn(), state };
});

vi.mock("@propelauth/react", () => ({
  useAuthInfo: () => auth.state,
  useLogoutFunction: () => auth.logout,
}));

const loggedInState: MockAuthState = {
  accessToken: "access-token-1",
  isLoggedIn: true,
  loading: false,
  user: {
    email: "ada@chartmetric.com",
    firstName: "Ada",
    lastName: "Lovelace",
    userId: "user-1",
  },
};

const accessContext = {
  account: { id: "org-1", role: "owner" },
  products: {
    chartmetric_app: { enabled: true },
    chartmetric_flow: { enabled: true, features: { sources: ["spotify"] } },
    onesheet: { enabled: false },
  },
  user: { id: "user-1" },
};

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock("./api/client", () => ({
  apiClient: { GET: apiGetMock },
}));

i18n.load({
  en: {
    ...enAccount,
    ...enCommon,
    ...enCreators,
    ...enDemo,
    ...enMusic,
    ...enSports,
  },
  es: { ...esCommon, ...esDemo },
});

const realFetch = fetch;

const stubFetch = (response: Response): ReturnType<typeof vi.fn> => {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const renderApp = (initialPath = "/"): void => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  history.pushState({}, "", initialPath);
  render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider i18n={i18n}>
        <MantineProvider defaultColorScheme="auto">
          <ModalsProvider>
            <App />
          </ModalsProvider>
        </MantineProvider>
      </I18nProvider>
    </QueryClientProvider>,
  );
};

describe("App", () => {
  // RequiredAuthProvider in main.tsx guarantees the app only renders for
  // authenticated users, so logged-in is the representative default.
  beforeEach(() => {
    apiGetMock.mockReset();
    apiGetMock.mockImplementation(async (path: string) => {
      await Promise.resolve();

      if (path === "/app/athletes/filter-options") {
        return {
          data: {
            cmScore: { max: null, min: null },
            nationalities: [],
            sports: [],
            types: [],
          },
        };
      }
      if (path === "/app/artists/filter-options") {
        return {
          data: {
            countries: [],
            genres: [],
            instagramFollowers: { max: null, min: 0 },
            tiktokFollowers: { max: null, min: 0 },
          },
        };
      }

      return { data: { data: [], meta: { limit: 25, offset: 0 } } };
    });
    i18n.activate("en");
    auth.state = loggedInState;
  });

  afterEach(() => {
    vi.stubGlobal("fetch", realFetch);
    vi.clearAllMocks();
  });

  it("redirects the root path to the music artists page", async () => {
    renderApp();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Artists" }),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: "Artists" })).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Language" })).toBeDefined();
    expect(location.pathname).toBe("/music/artists");
  });

  it("switches verticals from the global selector", async () => {
    renderApp("/music/artists");

    fireEvent.click(screen.getByRole("button", { name: "Switch vertical" }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "for Sports" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Athletes" }),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: "Athletes" })).toBeDefined();
    expect(location.pathname).toBe("/sports/athletes");
  });

  it("renders the creators vertical at its route", async () => {
    renderApp("/creators/influencers");

    expect(
      await screen.findByRole("heading", {
        name: "This is the Influencers page",
      }),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: "Influencers" })).toBeDefined();
  });

  it("renders the demo page header, chart card, and mantine controls", async () => {
    renderApp("/demo");

    expect(screen.getByRole("heading", { name: "Web" })).toBeDefined();
    expect(
      await screen.findByRole("heading", { name: "Monthly listeners" }),
    ).toBeDefined();
    expect(
      await screen.findByRole("button", { name: "Full screen" }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Open modal" })).toBeDefined();
  });

  it("toggles between light and dark mode", () => {
    renderApp("/demo");

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );

    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toBeDefined();
  });

  it("opens the add artist modal with the form", async () => {
    renderApp("/demo");

    fireEvent.click(screen.getByRole("button", { name: "Open modal" }));

    expect(await screen.findByText("Add artist")).toBeDefined();
    expect(await screen.findByLabelText(/Artist name/u)).toBeDefined();
    expect(await screen.findByLabelText(/Contact email/u)).toBeDefined();
  });

  it("shows the user email and logs out from the header", () => {
    renderApp("/music/artists");

    expect(
      screen.getByRole("link", { name: "ada@chartmetric.com" }),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(auth.logout).toHaveBeenCalledWith(true);
  });

  it("renders account id, role, and product access after login", async () => {
    const fetchMock = stubFetch(Response.json(accessContext, { status: 200 }));

    renderApp("/account");

    expect(await screen.findByText("org-1")).toBeDefined();
    expect(screen.getByText("Ada Lovelace")).toBeDefined();
    expect(screen.getByText("Owner")).toBeDefined();
    expect(screen.getByText("chartmetric_app")).toBeDefined();
    expect(screen.getAllByText("Enabled")).toHaveLength(2);
    expect(screen.getAllByText("Disabled")).toHaveLength(1);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.invalid/app/auth");
    expect(init.headers).toEqual({ Authorization: "Bearer access-token-1" });
  });

  it("explains a missing org membership on the account page", async () => {
    stubFetch(
      Response.json(
        { error: "no_org_membership", message: "No org." },
        { status: 403 },
      ),
    );

    renderApp("/account");

    expect(
      await screen.findByText(
        "Your user does not belong to an organization yet.",
      ),
    ).toBeDefined();
  });

  it("renders translated strings when the Spanish locale is active", async () => {
    i18n.activate("es");
    renderApp("/demo");

    expect(
      screen.getByRole("button", { name: "Cambiar a modo oscuro" }),
    ).toBeDefined();
    expect(
      await screen.findByRole("heading", { name: "Oyentes mensuales" }),
    ).toBeDefined();
  });
});
