import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ColumnPickerLabels, ColumnPickerOption } from "./types";

import { ColumnConfigureModal } from "./ColumnConfigureModal";

const options: ColumnPickerOption[] = [
  { group: "Overview", key: "rank", label: "Rank" },
  { group: "Overview", key: "name", label: "Athlete" },
  { group: "Instagram", key: "igFollowers", label: "Followers" },
  { group: "TikTok", key: "tiktokLikes", label: "Likes" },
];

const labels: ColumnPickerLabels = {
  close: "Done",
  configureDescription: "Choose columns",
  configureTitle: "Configure columns",
  deleteGroup: (name) => `Delete ${name}`,
  dragHandle: (label) => `Reorder ${label}`,
  empty: "No columns found",
  groupNamePlaceholder: "Group name",
  hiddenSection: "Hidden",
  moveDown: (label) => `Move ${label} down`,
  moveUp: (label) => `Move ${label} up`,
  presetsSection: "Presets",
  reset: "Reset",
  save: "Save",
  saveAsGroup: "Save as group",
  searchPlaceholder: "Find a column",
  trigger: "Columns",
  visibleSection: "Visible",
};

const renderModal = (
  overrides: {
    onChange?: (keys: string[]) => void;
    onClose?: () => void;
    value?: string[];
  } = {},
): void => {
  render(
    <MantineProvider>
      <ColumnConfigureModal
        defaultKeys={["rank"]}
        isOpen
        labels={labels}
        onChange={overrides.onChange ?? vi.fn()}
        onClose={overrides.onClose ?? vi.fn()}
        options={options}
        value={overrides.value ?? ["rank", "name"]}
      />
    </MantineProvider>,
  );
};

const search = (text: string): void => {
  fireEvent.change(screen.getByPlaceholderText("Find a column"), {
    target: { value: text },
  });
};

describe("ColumnConfigureModal", () => {
  it("splits the options into the selected ones and the rest", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText("Visible")).toBeDefined();
    expect(within(dialog).getByText("Hidden")).toBeDefined();
    expect(within(dialog).getByText("Rank")).toBeDefined();
    expect(within(dialog).getByText("Followers")).toBeDefined();
  });

  it("matches a column by its label", () => {
    renderModal();
    search("follow");

    expect(screen.getByText("Followers")).toBeDefined();
    expect(screen.queryByText("Rank")).toBeNull();
  });

  it("matches a column by its group", () => {
    renderModal();
    search("tiktok");

    expect(screen.getByText("Likes")).toBeDefined();
    expect(screen.queryByText("Rank")).toBeNull();
  });

  it("ignores case and surrounding space", () => {
    renderModal();
    search("  ATHLETE ");

    expect(screen.getByText("Athlete")).toBeDefined();
  });

  it("says so when nothing matches", () => {
    renderModal();
    search("nothing matches this");

    expect(screen.getByText("No columns found")).toBeDefined();
  });

  it("returns to the grouped lists when the search is cleared", () => {
    renderModal();
    search("follow");
    search("");

    expect(screen.getByText("Visible")).toBeDefined();
    expect(screen.getByText("Hidden")).toBeDefined();
  });

  // Named `close`, not `cancel`: a toggle applies as it is made, so dismissing
  // the modal keeps the changes rather than reverting them.
  it("keeps the changes when dismissed", () => {
    const onChange = vi.fn();
    renderModal({ onChange, value: ["rank", "name"] });

    fireEvent.click(screen.getByText("Followers"));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(onChange).toHaveBeenLastCalledWith(["rank", "name", "igFollowers"]);
  });

  // Only the disabled state is asserted: `fireEvent` dispatches straight at the
  // element, so it would reach a handler a real user cannot reach at all.
  it("will not let a locked column be hidden", () => {
    render(
      <MantineProvider>
        <ColumnConfigureModal
          defaultKeys={["name"]}
          isOpen
          labels={labels}
          onChange={vi.fn()}
          onClose={vi.fn()}
          options={[
            { key: "name", label: "Athlete", locked: true },
            { key: "sport", label: "Sport" },
          ]}
          value={["name", "sport"]}
        />
      </MantineProvider>,
    );

    expect(
      screen.getByRole<HTMLInputElement>("checkbox", { name: "Athlete" })
        .disabled,
    ).toBe(true);
    expect(
      screen.getByRole<HTMLInputElement>("checkbox", { name: "Sport" })
        .disabled,
    ).toBe(false);
  });

  it("gives a locked column no drag handle and no way to move", () => {
    render(
      <MantineProvider>
        <ColumnConfigureModal
          defaultKeys={["name"]}
          isOpen
          labels={labels}
          onChange={vi.fn()}
          onClose={vi.fn()}
          options={[
            { key: "name", label: "Athlete", locked: true },
            { key: "sport", label: "Sport" },
          ]}
          value={["name", "sport"]}
        />
      </MantineProvider>,
    );

    expect(
      screen.queryByRole("button", { name: "Reorder Athlete" }),
    ).toBeNull();
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "Move Athlete down",
      }).disabled,
    ).toBe(true);
    // The unlocked column below it cannot move up onto the locked position.
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Move Sport up" })
        .disabled,
    ).toBe(true);
  });

  it("reorders unlocked columns with the move buttons", () => {
    const onChange = vi.fn();
    renderModal({ onChange, value: ["rank", "name"] });

    fireEvent.click(screen.getByRole("button", { name: "Move Rank down" }));

    expect(onChange).toHaveBeenCalledWith(["name", "rank"]);
  });

  it("resets to the caller's defaults", () => {
    const onChange = vi.fn();
    renderModal({ onChange });

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(onChange).toHaveBeenCalledWith(["rank"]);
  });
});
