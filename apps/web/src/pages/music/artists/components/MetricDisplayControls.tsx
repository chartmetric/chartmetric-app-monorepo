import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Group, SegmentedControl } from "@mantine/core";

import type { ArtistChangePeriod, MetricDisplayMode } from "../types";

interface MetricDisplayControlsProps {
  changePeriod: ArtistChangePeriod;
  displayMode: MetricDisplayMode;
  onChangePeriod: (value: string) => void;
  onDisplayModeChange: (value: string) => void;
}

export const MetricDisplayControls: FC<MetricDisplayControlsProps> = ({
  changePeriod,
  displayMode,
  onChangePeriod,
  onDisplayModeChange,
}) => {
  const { t } = useLingui();

  return (
    <Group gap="sm" justify="flex-end">
      <SegmentedControl
        aria-label={t`Change period`}
        data={[
          { label: t`1D`, value: "1d" },
          { label: t`7D`, value: "7d" },
          { label: t`28D`, value: "28d" },
        ]}
        disabled={displayMode === "total"}
        onChange={onChangePeriod}
        size="xs"
        value={changePeriod}
      />
      <SegmentedControl
        aria-label={t`Value display`}
        data={[
          { label: t`Total`, value: "total" },
          { label: t`Change`, value: "change" },
          { label: t`% Change`, value: "percentChange" },
        ]}
        onChange={onDisplayModeChange}
        size="xs"
        value={displayMode}
      />
    </Group>
  );
};
