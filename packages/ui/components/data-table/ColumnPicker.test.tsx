import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { type FC, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ColumnPicker, type ColumnPickerItem } from "./ColumnPicker";

const INITIAL_ITEMS: ColumnPickerItem[] = [
  { key: "artist", label: "Artist", locked: true, visible: true },
  { key: "cmScore", label: "CM score", visible: true },
  { key: "instagram", label: "Instagram followers", visible: true },
  { key: "tiktok", label: "TikTok followers", visible: true },
];

const Harness: FC<{ onChange: (items: ColumnPickerItem[]) => void }> = ({
  onChange,
}) => {
  const [items, setItems] = useState(INITIAL_ITEMS);

  return (
    <ColumnPicker
      items={items}
      label="Columns"
      moveLabel={(columnLabel) => `Move ${columnLabel}`}
      onChange={(nextItems) => {
        setItems(nextItems);
        onChange(nextItems);
      }}
    />
  );
};

const renderPicker = async (onChange = vi.fn()): Promise<typeof onChange> => {
  render(
    <MantineProvider env="test">
      <Harness onChange={onChange} />
    </MantineProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /Columns/ }));
  await screen.findByRole("checkbox", { name: "Artist" });

  return onChange;
};

describe("ColumnPicker", () => {
  it("toggles column visibility and keeps locked columns disabled", async () => {
    const onChange = await renderPicker();

    const locked = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Artist",
    });
    expect(locked.disabled).toBe(true);
    expect(locked.checked).toBe(true);

    fireEvent.click(screen.getByRole("checkbox", { name: "TikTok followers" }));

    expect(onChange).toHaveBeenLastCalledWith([
      { key: "artist", label: "Artist", locked: true, visible: true },
      { key: "cmScore", label: "CM score", visible: true },
      { key: "instagram", label: "Instagram followers", visible: true },
      { key: "tiktok", label: "TikTok followers", visible: false },
    ]);
  });

  it("reorders columns with the keyboard", async () => {
    const onChange = await renderPicker();

    fireEvent.keyDown(screen.getByRole("button", { name: "Move CM score" }), {
      key: "ArrowDown",
    });

    expect(onChange).toHaveBeenLastCalledWith([
      { key: "artist", label: "Artist", locked: true, visible: true },
      { key: "instagram", label: "Instagram followers", visible: true },
      { key: "cmScore", label: "CM score", visible: true },
      { key: "tiktok", label: "TikTok followers", visible: true },
    ]);
  });

  it("does not move a column onto a locked position", async () => {
    const onChange = await renderPicker();

    fireEvent.keyDown(screen.getByRole("button", { name: "Move CM score" }), {
      key: "ArrowUp",
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("reorders columns with drag and drop", async () => {
    const onChange = await renderPicker();

    fireEvent.dragStart(
      screen.getByRole("button", { name: "Move TikTok followers" }),
    );
    const rows = screen.getAllByRole("listitem");
    const cmScoreRow = rows[1];
    if (cmScoreRow === undefined) throw new Error("missing row");
    fireEvent.drop(cmScoreRow);

    expect(onChange).toHaveBeenLastCalledWith([
      { key: "artist", label: "Artist", locked: true, visible: true },
      { key: "tiktok", label: "TikTok followers", visible: true },
      { key: "cmScore", label: "CM score", visible: true },
      { key: "instagram", label: "Instagram followers", visible: true },
    ]);
  });
});
