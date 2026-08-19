import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Divider, Group } from "@mantine/core";

import type { LeagueFilterValues } from "../../../filters/types";

import { useListFormatters } from "../../../../../../lib/formatting";
import { Pill } from "../../../../quick-filter-pills/Pill";
import { SingleSelectPills } from "./SingleSelectPills";

const TRACKED_ATHLETE_THRESHOLDS = [2, 5, 10] as const;
const REACH_THRESHOLDS = [1_000_000, 10_000_000, 100_000_000] as const;

interface LeagueQuickFiltersProps {
  onChange: (values: LeagueFilterValues) => void;
  sports: readonly string[];
  values: LeagueFilterValues;
}

export const LeagueQuickFilters: FC<LeagueQuickFiltersProps> = ({
  onChange,
  sports,
  values,
}) => {
  const { t } = useLingui();
  const formatters = useListFormatters();
  const thresholdOptions = (
    thresholds: readonly number[],
  ): { label: string; value: number }[] =>
    thresholds.map((threshold) => {
      const amount = formatters.compact.format(threshold);

      return {
        label: t({
          comment: "Leagues quick filter keeping leagues above a threshold",
          message: `${amount}+`,
        }),
        value: threshold,
      };
    });

  return (
    <Group align="center" gap="sm">
      <SingleSelectPills
        clearLabel={t`All Sports`}
        groupLabel={t`Sport`}
        onChange={(sport) => {
          onChange({ ...values, sport });
        }}
        options={sports.map((sport) => ({ label: sport, value: sport }))}
        value={values.sport}
      />
      <Divider orientation="vertical" />
      <SingleSelectPills
        groupLabel={t`Athletes`}
        onChange={(minTrackedAthletes) => {
          onChange({ ...values, minTrackedAthletes });
        }}
        options={thresholdOptions(TRACKED_ATHLETE_THRESHOLDS)}
        value={values.minTrackedAthletes}
      />
      <Divider orientation="vertical" />
      <SingleSelectPills
        groupLabel={t`Reach`}
        onChange={(minAggregatedIgFollowers) => {
          onChange({ ...values, minAggregatedIgFollowers });
        }}
        options={thresholdOptions(REACH_THRESHOLDS)}
        value={values.minAggregatedIgFollowers}
      />
      <Divider orientation="vertical" />
      <Pill
        isActive={values.isMegaOnly}
        label={t`Mega only`}
        onToggle={() => {
          onChange({ ...values, isMegaOnly: !values.isMegaOnly });
        }}
      />
    </Group>
  );
};
