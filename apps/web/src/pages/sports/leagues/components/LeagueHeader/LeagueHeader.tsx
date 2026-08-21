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
    <Group align="center" gap="xs" justify="space-between" wrap="nowrap">
      <Group align="center" gap="xs" miw={0} wrap="nowrap">
        <LeagueTitle total={total} />
        <SearchInput
          label={t`Search by league name`}
          name="league-search"
          onChange={(name) => {
            updateFilters({ ...filterValues, name });
          }}
          placeholder={t`Search leagues…`}
          value={filterValues.name}
          width={170}
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
