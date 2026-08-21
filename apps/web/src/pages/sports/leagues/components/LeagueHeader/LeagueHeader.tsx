import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Box, Group } from "@mantine/core";
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
  const sortMenu = (
    <LeagueSortMenu
      onSort={onSort}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );

  // The sort control renders twice so keyboard order always matches visual
  // order: on the title row while the header wraps (below xl), at the end of
  // the single row above it. display:none keeps the inactive copy out of the
  // accessibility tree. xl because the switch must sit at or above the width
  // where the single row fits, or the control wraps to the bottom row before
  // jumping to the title row as the viewport narrows.
  return (
    <Group align="center" gap="sm" wrap="wrap">
      <LeagueTitle total={total} />
      <Box hiddenFrom="xl" ml="auto">
        {sortMenu}
      </Box>
      {/* Closes the title row while the header wraps, so search and the
          filter groups start on their own rows instead of filling the slack
          beside the sort control. */}
      <Box flex="1 0 100%" h={0} hiddenFrom="xl" />
      <SearchInput
        label={t`Search by league name`}
        name="league-search"
        onChange={(name) => {
          updateFilters({ ...filterValues, name });
        }}
        placeholder={t`Search leagues…`}
        value={filterValues.name}
        width={{ base: "100%", sm: 170 }}
      />
      <LeagueQuickFilters
        onChange={updateFilters}
        sports={options?.sports ?? []}
        values={filterValues}
      />
      <Box ml="auto" visibleFrom="xl">
        {sortMenu}
      </Box>
    </Group>
  );
};
