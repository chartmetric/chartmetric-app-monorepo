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

  return (
    <ColumnPicker
      items={columns.map((column) => ({
        key: column.key,
        label: labels[column.key],
        ...(column.key === "artist" && { locked: true }),
        visible: column.visible,
      }))}
      label={t`Columns`}
      moveLabel={(columnLabel) =>
        t({
          comment: "Accessible label of the drag handle for a table column",
          message: `Move ${columnLabel}`,
        })
      }
      onChange={(items) => {
        onChange(
          items.flatMap((item) =>
            isArtistColumnKey(item.key)
              ? [{ key: item.key, visible: item.visible }]
              : [],
          ),
        );
      }}
    />
  );
};
