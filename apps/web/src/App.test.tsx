import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";
import { messages as enMessages } from "./locales/en/messages.po";
import { messages as esMessages } from "./locales/es/messages.po";

i18n.load({ en: enMessages, es: esMessages });

const renderApp = (): void => {
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

  it("renders the header, chart card, and mantine controls", async () => {
    renderApp();

    expect(screen.getByRole("heading", { name: "Web" })).toBeDefined();
    expect(
      await screen.findByRole("heading", { name: "Monthly listeners" }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Open modal" })).toBeDefined();
  });

  it("toggles between light and dark mode", () => {
    renderApp();

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );

    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toBeDefined();
  });

  it("opens the add artist modal with the form", async () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Open modal" }));

    expect(await screen.findByText("Add artist")).toBeDefined();
    expect(await screen.findByLabelText(/Artist name/u)).toBeDefined();
    expect(await screen.findByLabelText(/Contact email/u)).toBeDefined();
  });

  it("renders translated strings when the Spanish locale is active", async () => {
    i18n.activate("es");
    renderApp();

    expect(
      screen.getByRole("button", { name: "Cambiar a modo oscuro" }),
    ).toBeDefined();
    expect(
      await screen.findByRole("heading", { name: "Oyentes mensuales" }),
    ).toBeDefined();
  });
});
