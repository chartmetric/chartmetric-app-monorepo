import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Counter } from "./Counter";

const renderCounter = (): void => {
  render(
    <MantineProvider>
      <Counter />
    </MantineProvider>,
  );
};

describe("Counter", () => {
  it("renders with an initial count of 0", () => {
    renderCounter();

    expect(screen.getByRole("button").textContent).toBe("0");
  });

  it("increments the count on click", () => {
    renderCounter();
    const button = screen.getByRole("button");

    fireEvent.click(button);

    expect(button.textContent).toBe("1");
  });
});
