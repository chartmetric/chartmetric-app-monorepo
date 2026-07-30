import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";
import { messages as enCommon } from "./locales/common/en/messages.po";
import { messages as esCommon } from "./locales/common/es/messages.po";
import { messages as enCreators } from "./locales/creators/en/messages.po";
import { messages as enDemo } from "./locales/demo/en/messages.po";
import { messages as esDemo } from "./locales/demo/es/messages.po";
import { messages as enMusic } from "./locales/music/en/messages.po";
import { messages as enSports } from "./locales/sports/en/messages.po";

i18n.load({
  en: { ...enCommon, ...enCreators, ...enDemo, ...enMusic, ...enSports },
  es: { ...esCommon, ...esDemo },
});

const renderApp = (initialPath = "/"): void => {
  history.pushState({}, "", initialPath);
  render(
    <I18nProvider i18n={i18n}>
      <MantineProvider defaultColorScheme="auto">
        <ModalsProvider>
          <App />
        </ModalsProvider>
      </MantineProvider>
    </I18nProvider>,
  );
};

describe("App", () => {
  beforeEach(() => {
    i18n.activate("en");
  });

  it("redirects the root path to the music artists page", async () => {
    renderApp();

    expect(
      await screen.findByRole("heading", { name: "This is the Artists page" }),
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
      await screen.findByRole("heading", { name: "This is the Athletes page" }),
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
