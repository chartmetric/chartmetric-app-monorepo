import { useLingui } from "@lingui/react/macro";
import { ColumnPicker, type ColumnPickerPreset } from "@repo/ui/column-picker";
import { type FC, useMemo } from "react";

import {
  ATHLETE_COLUMN_PACKS,
  ATHLETE_COLUMNS,
  type AthleteColumnKey,
  DEFAULT_ATHLETE_COLUMNS,
  isAthleteColumnKey,
} from "../athlete-columns";

export interface AthleteColumnPreset {
  keys: AthleteColumnKey[];
  name: string;
}

interface AthleteColumnPickerProps {
  customPresets: readonly AthleteColumnPreset[];
  onChange: (keys: AthleteColumnKey[]) => void;
  onCustomPresetsChange: (presets: AthleteColumnPreset[]) => void;
  value: readonly AthleteColumnKey[];
}

const toAthletePreset = (preset: ColumnPickerPreset): AthleteColumnPreset => ({
  keys: preset.keys.filter((key) => isAthleteColumnKey(key)),
  name: preset.name,
});

const COLUMN_PACK_PRESETS: ColumnPickerPreset[] = ATHLETE_COLUMN_PACKS.map(
  (pack) => ({ keys: pack.keys, name: pack.name }),
);

// Full names rather than the table's abbreviated headings, since the picker
// lists Instagram and TikTok metrics side by side.
const useColumnNames = (): Record<AthleteColumnKey, string> => {
  const { t } = useLingui();

  return useMemo(
    () => ({
      age: t`Age`,
      club: t`Team`,
      gpsScore: t`GPS`,
      igEngagementRate: t`Engagement`,
      igFollowers: t`Instagram followers`,
      igPosts: t`Instagram posts`,
      lastMatchDate: t`Last game`,
      league: t`League`,
      level: t`Level`,
      momentum: t`Momentum`,
      nationality: t`Nationality`,
      position: t`Position`,
      tiktokFollowers: t`TikTok followers`,
      tiktokHearts: t`TikTok hearts`,
      tiktokLikes: t`TikTok likes`,
      tiktokPosts: t`TikTok posts`,
      tiktokVideos: t`TikTok videos`,
    }),
    [t],
  );
};

export const AthleteColumnPicker: FC<AthleteColumnPickerProps> = ({
  customPresets,
  onChange,
  onCustomPresetsChange,
  value,
}) => {
  const { t } = useLingui();
  const columnNames = useColumnNames();
  const options = useMemo(
    () =>
      ATHLETE_COLUMNS.map((column) => ({
        group: column.source,
        key: column.key,
        label: columnNames[column.key],
      })),
    [columnNames],
  );

  return (
    <ColumnPicker
      customPresets={customPresets}
      defaultKeys={DEFAULT_ATHLETE_COLUMNS}
      labels={{
        close: t`Done`,
        configureDescription: t`Add, remove or reorder columns`,
        configureTitle: t`Configure columns`,
        dragHandle: (label) =>
          t({
            comment: "Accessible label of the drag handle that reorders a column",
            message: `Reorder ${label}`,
          }),
        deleteGroup: (name) =>
          t({
            comment: "Accessible label for deleting a saved column group",
            message: `Delete group ${name}`,
          }),
        empty: t`No matching columns`,
        groupNamePlaceholder: t`New group name…`,
        hiddenSection: t`Hidden`,
        moveDown: (label) =>
          t({
            comment: "Accessible label for moving a column later",
            message: `Move ${label} later`,
          }),
        moveUp: (label) =>
          t({
            comment: "Accessible label for moving a column earlier",
            message: `Move ${label} earlier`,
          }),
        presetsSection: t`Column groups`,
        reset: t`Reset to default`,
        save: t`Save`,
        saveAsGroup: t`Save as group`,
        searchPlaceholder: t`Search columns…`,
        trigger: t`Columns`,
        visibleSection: t`Visible`,
      }}
      onChange={(keys) => {
        onChange(keys.filter((key) => isAthleteColumnKey(key)));
      }}
      onCustomPresetsChange={(nextPresets) => {
        onCustomPresetsChange(
          nextPresets.map((preset) => toAthletePreset(preset)),
        );
      }}
      options={options}
      presets={COLUMN_PACK_PRESETS}
      value={value}
    />
  );
};
