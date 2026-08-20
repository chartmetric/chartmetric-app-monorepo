import { MantineProvider } from "@mantine/core";
import { baseTheme } from "@repo/ui/theme";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NumericCell } from "./NumericCell";

describe("NumericCell", () => {
  it("renders the value in the theme's data face at the given size", () => {
    render(
      <MantineProvider theme={baseTheme}>
        <NumericCell size="xs" value="12.5M" />
      </MantineProvider>,
    );

    const style = screen.getByText("12.5M").getAttribute("style") ?? "";

    expect(style).toContain(
      "font-family: var(--mantine-font-family-monospace)",
    );
    expect(style).toContain("--text-fz: var(--mantine-font-size-xs)");
  });
});
