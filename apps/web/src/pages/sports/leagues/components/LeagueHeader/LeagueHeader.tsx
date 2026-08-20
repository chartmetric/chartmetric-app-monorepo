import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Group } from "@mantine/core";
import { SearchInput } from "@repo/ui/search-input";

import type {
  LeagueFilterOptionsReply,
  LeagueFilters as LeagueFilterQuery,
  LeagueSortBy,
  LeagueSortDirection,
} from "../../api/types";

import { useLeagueFilterValues } from "../../filters/filter-state";
import { LeagueQuickFilters } from "./components/LeagueQuickFilters";
import { LeagueSortMenu } from "./components/LeagueSortMenu";
import { LeagueTitle } from "./components/LeagueTitle";

export interface LeagueHeaderProps {
  onChange: (filters: LeagueFilterQuery) => void;
  onSort: (sortBy: LeagueSortBy) => void;
  options: LeagueFilterOptionsReply | undefined;
  sortBy: LeagueSortBy;
  sortDirection: LeagueSortDirection;
  total: number | undefined;
}

/*
 * One row owns everything that identifies, narrows, or orders the list. A
 * control parked in the page corner reads as page chrome rather than as a
 * table control, so search and sort sit with the pills that do the same job.
 */
export const LeagueHeader: FC<LeagueHeaderProps> = ({
  onChange,
  onSort,
  options,
  sortBy,
  sortDirection,
  total,
}) => {
  const { t } = useLingui();
  const { filterValues, updateFilters } = useLeagueFilterValues(onChange);

  return (
    <Group align="center" gap="sm" justify="space-between">
      <Group align="center" gap="sm" miw={0}>
        <LeagueTitle total={total} />
        <SearchInput
          label={t`Search by league name`}
          name="league-search"
          onChange={(name) => {
            updateFilters({ ...filterValues, name });
          }}
          placeholder={t`Search leagues…`}
          value={filterValues.name}
        />
        <LeagueQuickFilters
          onChange={updateFilters}
          sports={options?.sports ?? []}
          values={filterValues}
        />
      </Group>
      <LeagueSortMenu
        onSort={onSort}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Group>
  );
};
