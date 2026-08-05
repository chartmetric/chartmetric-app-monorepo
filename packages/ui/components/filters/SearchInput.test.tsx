import type { ReactNode } from "react";

import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchInput } from "./SearchInput";

const renderWithProvider = (component: ReactNode): void => {
  render(<MantineProvider>{component}</MantineProvider>);
};

describe("SearchInput", () => {
  it("labels the field for assistive technology", () => {
    renderWithProvider(
      <SearchInput
        label="Search by name"
        onChange={vi.fn()}
        placeholder="Search athletes…"
        value=""
      />,
    );

    expect(screen.getByRole("textbox", { name: "Search by name" })).toEqual(
      screen.getByPlaceholderText("Search athletes…"),
    );
  });

  it("reports the typed text rather than the event", () => {
    const onChange = vi.fn();

    renderWithProvider(
      <SearchInput
        label="Search by name"
        onChange={onChange}
        placeholder="Search athletes…"
        value=""
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "messi" },
    });

    expect(onChange).toHaveBeenCalledWith("messi");
  });

  it("shows the caller's value", () => {
    renderWithProvider(
      <SearchInput
        label="Search by name"
        onChange={vi.fn()}
        placeholder="Search athletes…"
        value="roma"
      />,
    );

    expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("roma");
  });

  // Only the disabled state is asserted: `fireEvent` dispatches events directly,
  // so it would reach the handler of a disabled field that a real user cannot
  // reach at all.
  it("marks the field disabled", () => {
    renderWithProvider(
      <SearchInput
        disabled
        label="Search by name"
        onChange={vi.fn()}
        placeholder="Search athletes…"
        value=""
      />,
    );

    expect(screen.getByRole<HTMLInputElement>("textbox").disabled).toBe(true);
  });

  // Browsers offer previous form entries otherwise, which covers the results.
  it("does not autocomplete", () => {
    renderWithProvider(
      <SearchInput
        label="Search by name"
        onChange={vi.fn()}
        placeholder="Search athletes…"
        value=""
      />,
    );

    expect(screen.getByRole("textbox").getAttribute("autocomplete")).toBe(
      "off",
    );
  });
});
