import type { ReactNode } from "react";

import { Button, MantineProvider, NumberInput, TextInput } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { baseTheme } from "./theme";

const renderThemed = (component: ReactNode): void => {
  render(<MantineProvider theme={baseTheme}>{component}</MantineProvider>);
};

/**
 * Mantine resolves sizes to CSS variables in an inline `style`, so the chosen
 * size tier is observable without loading its stylesheet — which jsdom does
 * not do. Reading the variable is what makes these assertions meaningful.
 */
const inlineStyle = (element: Element | null | undefined): string =>
  element?.getAttribute("style") ?? "";

describe("compact control defaults", () => {
  it("renders buttons one size below the Mantine default", () => {
    renderThemed(<Button>Genre</Button>);

    expect(
      inlineStyle(screen.getByRole("button", { name: "Genre" })),
    ).toContain("--button-height: var(--button-height-xs)");
  });

  it("keeps button labels at the sm font size despite the smaller box", () => {
    renderThemed(<Button>Genre</Button>);

    expect(
      inlineStyle(screen.getByRole("button", { name: "Genre" })),
    ).toContain("--button-fz: var(--mantine-font-size-sm)");
  });

  it("leaves an explicitly sized button on its own type scale", () => {
    renderThemed(<Button size="lg">Upgrade</Button>);

    const style = inlineStyle(screen.getByRole("button", { name: "Upgrade" }));

    // The font-size override is scoped to the compact default; a caller asking
    // for a large button must not get small text inside it.
    expect(style).toContain("--button-height: var(--button-height-lg)");
    expect(style).toContain("--button-fz: var(--mantine-font-size-lg)");
  });

  it.each([
    ["TextInput", <TextInput aria-label="Search" key="text" />],
    ["NumberInput", <NumberInput aria-label="Search" key="number" />],
  ])(
    "shrinks %s to the same tier as buttons so they align in a row",
    (_name, component) => {
      renderThemed(component);

      // Mantine puts the size variables on the wrapper, not the control.
      const wrapper = screen.getByLabelText("Search").parentElement;

      expect(inlineStyle(wrapper)).toContain(
        "--input-height: var(--input-height-xs)",
      );
      expect(inlineStyle(wrapper)).toContain(
        "--input-fz: var(--mantine-font-size-sm)",
      );
    },
  );
});
