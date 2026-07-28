import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

const renderApp = (): void => {
  render(
    <MantineProvider defaultColorScheme="auto">
      <ModalsProvider>
        <App />
      </ModalsProvider>
    </MantineProvider>,
  );
};

describe("App", () => {
  it("renders the header, chart card, and mantine controls", () => {
    renderApp();

    expect(screen.getByRole("heading", { name: "Web" })).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Monthly listeners" }),
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
});
