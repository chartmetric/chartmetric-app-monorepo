import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import { Button, Divider } from "@mantine/core";

import type { AthleteLevel } from "../../../../api/types";
import type {
  AthleteFilterValues,
  FollowerRange,
} from "../../../../filters/types";

import { FollowerPills } from "./FollowerPills";
import { LevelPills } from "./LevelPills";

export interface AthleteQuickFiltersProps {
  compactFormatter: Intl.NumberFormat;
  onFollowersChange: (followers: FollowerRange) => void;
  onLevelsChange: (levels: readonly AthleteLevel[]) => void;
  onVerifiedChange: (isVerified: boolean) => void;
  values: AthleteFilterValues;
}

export const AthleteQuickFilters: FC<AthleteQuickFiltersProps> = ({
  compactFormatter,
  onFollowersChange,
  onLevelsChange,
  onVerifiedChange,
  values,
}) => (
  <>
    <LevelPills levels={values.levels} onChange={onLevelsChange} />
    <Divider orientation="vertical" />
    <FollowerPills
      compactFormatter={compactFormatter}
      onChange={onFollowersChange}
      value={values.followers}
    />
    <Divider orientation="vertical" />
    <Button
      aria-pressed={values.isVerified}
      onClick={() => {
        onVerifiedChange(!values.isVerified);
      }}
      size="compact-xs"
      variant={values.isVerified ? "filled" : "default"}
    >
      <Trans comment="Filter limiting the list to verified accounts">
        Verified
      </Trans>
    </Button>
  </>
);
