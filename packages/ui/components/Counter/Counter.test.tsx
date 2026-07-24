import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Counter } from "./Counter";

describe("Counter", () => {
  it("renders with an initial count of 0", () => {
    render(<Counter />);

    expect(screen.getByRole("button").textContent).toBe("0");
  });

  it("increments the count on click", () => {
    render(<Counter />);
    const button = screen.getByRole("button");

    fireEvent.click(button);

    expect(button.textContent).toBe("1");
  });
});
