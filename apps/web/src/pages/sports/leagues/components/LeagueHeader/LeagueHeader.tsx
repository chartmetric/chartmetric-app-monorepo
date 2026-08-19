import type { FC } from "react";

import { Stack } from "@mantine/core";

import type {
  LeagueFilterOptionsReply,
  LeagueFilters as LeagueFilterQuery,
} from "../../api/types";

import { useLeagueFilterValues } from "../../filters/filter-state";
import { LeagueQuickFilters } from "./components/LeagueQuickFilters";
import { LeagueTitleRow } from "./components/LeagueTitleRow";

export interface LeagueHeaderProps {
  onChange: (filters: LeagueFilterQuery) => void;
  options: LeagueFilterOptionsReply | undefined;
  total: number | undefined;
}

export const LeagueHeader: FC<LeagueHeaderProps> = ({
  onChange,
  options,
  total,
}) => {
  const { filterValues, updateFilters } = useLeagueFilterValues(onChange);

  return (
    <Stack gap="sm">
      <LeagueTitleRow
        name={filterValues.name}
        onNameChange={(name) => {
          updateFilters({ ...filterValues, name });
        }}
        total={total}
      />
      <LeagueQuickFilters
        onChange={updateFilters}
        sports={options?.sports ?? []}
        values={filterValues}
      />
    </Stack>
  );
};
