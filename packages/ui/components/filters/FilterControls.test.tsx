import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type FC, type ReactNode, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { FilterBar } from "./FilterBar";
import {
  emptyMultiSelectValue,
  MultiSelectFilter,
  type MultiSelectFilterValue,
} from "./MultiSelectFilter";
import { type NumericRangeValue, RangeFilter } from "./RangeFilter";

const renderWithProvider = (component: ReactNode): void => {
  render(<MantineProvider>{component}</MantineProvider>);
};

const MultiSelectHarness: FC<{
  onChange: (value: MultiSelectFilterValue) => void;
}> = ({ onChange }) => {
  const [value, setValue] = useState<MultiSelectFilterValue>(
    emptyMultiSelectValue,
  );

  return (
    <MultiSelectFilter
      emptyMessage="No sports found"
      excludeLabel="Exclude"
      includeLabel="Include"
      label="Sport"
      onChange={(nextValue) => {
        setValue(nextValue);
        onChange(nextValue);
      }}
      options={[
        { description: "2", label: "Football", value: "Football" },
        { description: "1", label: "Tennis", value: "Tennis" },
      ]}
      searchPlaceholder="Find a sport"
      value={value}
    />
  );
};

const RangeHarness: FC<{
  onChange: (value: NumericRangeValue) => void;
}> = ({ onChange }) => {
  const [value, setValue] = useState<NumericRangeValue>([null, null]);

  return (
    <RangeFilter
      clearLabel="Clear"
      label="CM score"
      max={100}
      maximumLabel="Maximum score"
      min={0}
      minimumLabel="Minimum score"
      onChange={(nextValue) => {
        setValue(nextValue);
        onChange(nextValue);
      }}
      value={value}
    />
  );
};

describe("filter controls", () => {
  it("combines included and excluded selections", () => {
    const onChange = vi.fn();
    renderWithProvider(<MultiSelectHarness onChange={onChange} />);

    fireEvent.click(screen.getByRole("combobox", { name: "Sport" }));
    fireEvent.click(screen.getByRole("option", { name: /Football/ }));

    expect(onChange).toHaveBeenLastCalledWith({
      excluded: [],
      included: ["Football"],
    });

    fireEvent.click(screen.getByRole("radio", { name: "Exclude" }));

    const footballOnExcludeTab = screen.getByRole("option", {
      name: /Football/,
    });
    expect(Object.hasOwn(footballOnExcludeTab.dataset, "comboboxActive")).toBe(
      false,
    );

    fireEvent.click(screen.getByRole("option", { name: /Tennis/ }));

    expect(onChange).toHaveBeenLastCalledWith({
      excluded: ["Tennis"],
      included: ["Football"],
    });

    fireEvent.click(screen.getByRole("option", { name: /Football/ }));

    expect(onChange).toHaveBeenLastCalledWith({
      excluded: ["Tennis", "Football"],
      included: [],
    });
  });

  /**
   * Some filters resolve through a lookup that only answers membership, so there
   * is no exclude for them to express. Offering the control anyway gave the
   * reader a toggle that snapped back and changed nothing.
   */
  it("hides the exclude toggle when the filter cannot exclude", () => {
    renderWithProvider(
      <MantineProvider>
        <MultiSelectFilter
          canExclude={false}
          emptyMessage="No leagues found"
          excludeLabel="Exclude"
          includeLabel="Include"
          label="League"
          onChange={vi.fn()}
          options={[{ label: "Serie A", value: "Serie A" }]}
          searchPlaceholder="Find a league"
          value={{ excluded: [], included: [] }}
        />
      </MantineProvider>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "League" }));

    expect(screen.queryByRole("radio", { name: "Exclude" })).toBeNull();
    expect(screen.getByRole("option", { name: /Serie A/ })).toBeDefined();
  });

  it("offers the exclude toggle by default", () => {
    renderWithProvider(<MultiSelectHarness onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("combobox", { name: "Sport" }));

    expect(screen.getByRole("radio", { name: "Exclude" })).toBeDefined();
  });

  it("anchors the dropdown to its trigger and closes outside", async () => {
    renderWithProvider(<MultiSelectHarness onChange={vi.fn()} />);

    const trigger = screen.getByRole("combobox", { name: "Sport" });
    fireEvent.click(trigger);

    const listbox = screen.getByRole("listbox");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(listbox.id);

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });

  it("filters categorical options with search", () => {
    renderWithProvider(<MultiSelectHarness onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("combobox", { name: "Sport" }));
    fireEvent.change(screen.getByPlaceholderText("Find a sport"), {
      target: { value: "ten" },
    });

    expect(screen.getByRole("option", { name: /Tennis/ })).toBeDefined();
    expect(screen.queryByRole("option", { name: /Football/ })).toBeNull();
  });

  it("edits and clears a numeric range", async () => {
    const onChange = vi.fn();
    renderWithProvider(<RangeHarness onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "CM score" }));
    const minimumInput = await screen.findByRole<HTMLInputElement>("textbox", {
      name: "Minimum score",
    });
    const maximumInput = screen.getByRole<HTMLInputElement>("textbox", {
      hidden: true,
      name: "Maximum score",
    });

    expect(minimumInput.value).toBe("0");
    expect(maximumInput.value).toBe("100");
    fireEvent.change(minimumInput, { target: { value: "25" } });

    expect(onChange).toHaveBeenLastCalledWith([25, 100]);

    fireEvent.change(maximumInput, { target: { value: "75" } });

    expect(onChange).toHaveBeenLastCalledWith([25, 75]);

    fireEvent.click(await screen.findByText("Clear"));

    expect(onChange).toHaveBeenLastCalledWith([null, null]);
    expect(minimumInput.value).toBe("0");
    expect(maximumInput.value).toBe("100");
  });

  it("composes filter content with a clear action", () => {
    const onClear = vi.fn();
    renderWithProvider(
      <FilterBar clearLabel="Clear filters" label="Filters" onClear={onClear}>
        <span>Filter content</span>
      </FilterBar>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  /**
   * The main row wraps only as it fills, which splits a group of compact
   * controls at whatever point it runs out of space. The row below keeps them
   * together, beneath everything else.
   */
  it("keeps the row below separate from the main filters", () => {
    renderWithProvider(
      <FilterBar
        clearLabel="Clear filters"
        label="Filters"
        onClear={vi.fn()}
        rowBelow={<button type="button">Verified</button>}
      >
        <span>Filter content</span>
      </FilterBar>,
    );

    const main = screen.getByText("Filter content");
    const secondary = screen.getByRole("button", { name: "Verified" });

    expect(main.parentElement).not.toBe(secondary.parentElement);
    expect(
      main.compareDocumentPosition(secondary) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("composes without a row below", () => {
    renderWithProvider(
      <FilterBar clearLabel="Clear filters" label="Filters" onClear={vi.fn()}>
        <span>Filter content</span>
      </FilterBar>,
    );

    expect(screen.getByText("Filter content")).toBeDefined();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeDefined();
  });
});
