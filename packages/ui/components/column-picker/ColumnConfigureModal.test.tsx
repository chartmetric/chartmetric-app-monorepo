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

  // The group is the source a column comes from, so searching "tiktok" should
  // find its columns even though none of them say TikTok in the label.
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

  it("resets to the caller's defaults", () => {
    const onChange = vi.fn();
    renderModal({ onChange });

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(onChange).toHaveBeenCalledWith(["rank"]);
  });
});
