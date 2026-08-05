import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { ColumnPicker } from "@repo/ui/column-picker";

import type { ArtistColumnConfig, ArtistColumnKey } from "../types";

import { ARTIST_COLUMN_KEYS } from "../constants";

const isArtistColumnKey = (value: string): value is ArtistColumnKey =>
  (ARTIST_COLUMN_KEYS as readonly string[]).includes(value);

interface ArtistColumnPickerProps {
  columns: ArtistColumnConfig[];
  onChange: (columns: ArtistColumnConfig[]) => void;
}

export const ArtistColumnPicker: FC<ArtistColumnPickerProps> = ({
  columns,
  onChange,
}) => {
  const { t } = useLingui();
  const labels: Record<ArtistColumnKey, string> = {
    artist: t`Artist`,
    cmScore: t`CM score`,
    instagramFollowers: t`Instagram followers`,
    tiktokFollowers: t`TikTok followers`,
  };
  const visibleKeys = columns
    .filter((column) => column.visible)
    .map((column) => column.key);

  return (
    <ColumnPicker
      defaultKeys={visibleKeys}
      labels={{
        close: t`Done`,
        configureDescription: t`Choose which columns to show and their order`,
        configureTitle: t`Configure columns`,
        deleteGroup: (name) =>
          t({
            comment: "Accessible label of the button deleting a saved column set",
            message: `Delete ${name}`,
          }),
        dragHandle: (label) =>
          t({
            comment: "Accessible label of the drag handle that reorders a column",
            message: `Reorder ${label}`,
          }),
        empty: t`No columns found`,
        groupNamePlaceholder: t`Name this set`,
        hiddenSection: t`Hidden`,
        moveDown: (label) =>
          t({
            comment: "Accessible label of the button moving a column later",
            message: `Move ${label} down`,
          }),
        moveUp: (label) =>
          t({
            comment: "Accessible label of the button moving a column earlier",
            message: `Move ${label} up`,
          }),
        presetsSection: t`Saved sets`,
        reset: t`Reset`,
        save: t`Save`,
        saveAsGroup: t`Save as set`,
        searchPlaceholder: t`Find a column`,
        trigger: t`Columns`,
        visibleSection: t`Visible`,
      }}
      onChange={(keys) => {
        const chosen = keys.filter((key) => isArtistColumnKey(key));

        // The picker reports the visible columns in order; everything else keeps
        // its place behind them so toggling a column back on is not a surprise.
        onChange([
          ...chosen.map((key) => ({ key, visible: true })),
          ...columns
            .filter((column) => !chosen.includes(column.key))
            .map((column) => ({ ...column, visible: false })),
        ]);
      }}
      options={columns.map((column) => ({
        key: column.key,
        label: labels[column.key],
        // The artist column identifies the row; hiding or moving it would leave
        // the table unreadable.
        ...(column.key === "artist" && { locked: true }),
      }))}
      value={visibleKeys}
    />
  );
};
