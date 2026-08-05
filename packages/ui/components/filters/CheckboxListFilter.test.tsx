import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { type FC, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { CheckboxListFilter } from "./CheckboxListFilter";
import {
  emptyMultiSelectValue,
  type MultiSelectFilterValue,
} from "./MultiSelectFilter";
import { RangeFilter } from "./RangeFilter";

const OPTIONS = [
  { description: "12", label: "United States", value: "US" },
  { description: "5", label: "South Korea", value: "KR" },
  { description: "3", label: "Brazil", value: "BR" },
];

const CheckboxListHarness: FC<{
  onChange: (value: MultiSelectFilterValue) => void;
}> = ({ onChange }) => {
  const [value, setValue] = useState<MultiSelectFilterValue>(
    emptyMultiSelectValue,
  );

  return (
    <CheckboxListFilter
      emptyMessage="No matching countries"
      label="Country"
      onChange={(nextValue) => {
        setValue(nextValue);
        onChange(nextValue);
      }}
      options={OPTIONS}
      searchPlaceholder="Search countries…"
      value={value}
    />
  );
};

describe("CheckboxListFilter", () => {
  it("cycles options through included and excluded states", () => {
    const onChange = vi.fn();
    render(
      <MantineProvider>
        <CheckboxListHarness onChange={onChange} />
      </MantineProvider>,
    );

    const korea = screen.getByRole("checkbox", { name: /South Korea/ });

    fireEvent.click(korea);
    expect(onChange).toHaveBeenLastCalledWith({
      excluded: [],
      included: ["KR"],
    });

    fireEvent.click(korea);
    expect(onChange).toHaveBeenLastCalledWith({
      excluded: ["KR"],
      included: [],
    });

    fireEvent.click(screen.getByRole("checkbox", { name: /United States/ }));
    expect(onChange).toHaveBeenLastCalledWith({
      excluded: ["KR"],
      included: ["US"],
    });

    fireEvent.click(korea);
    expect(onChange).toHaveBeenLastCalledWith({
      excluded: [],
      included: ["US"],
    });
  });

  it("filters options by search and shows an empty message", () => {
    render(
      <MantineProvider>
        <CheckboxListHarness onChange={vi.fn()} />
      </MantineProvider>,
    );

    const search = screen.getByRole("textbox", { name: "Search countries…" });
    fireEvent.change(search, { target: { value: "kor" } });

    expect(screen.getByRole("checkbox", { name: /South Korea/ })).toBeDefined();
    expect(
      screen.queryByRole("checkbox", { name: /United States/ }),
    ).toBeNull();

    fireEvent.change(search, { target: { value: "zzz" } });
    expect(screen.getByText("No matching countries")).toBeDefined();
  });
});

describe("RangeFilter without bounds", () => {
  it("renders inputs but no slider, and emits typed values", async () => {
    const onChange = vi.fn();
    render(
      <MantineProvider>
        <RangeFilter
          clearLabel="Clear"
          label="Instagram followers"
          maximumLabel="Maximum followers"
          minimumLabel="Minimum followers"
          onChange={onChange}
          value={[null, null]}
        />
      </MantineProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Instagram followers" }),
    );
    const minimumInput = await screen.findByRole<HTMLInputElement>("textbox", {
      name: "Minimum followers",
    });

    expect(screen.queryByRole("slider")).toBeNull();
    expect(minimumInput.value).toBe("");

    fireEvent.change(minimumInput, { target: { value: "1000" } });
    expect(onChange).toHaveBeenLastCalledWith([1000, null]);
  });
});
