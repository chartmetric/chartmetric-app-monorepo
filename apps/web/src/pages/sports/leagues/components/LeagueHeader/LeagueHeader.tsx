import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Group } from "@mantine/core";
import { SearchInput } from "@repo/ui/search-input";

import type {
  LeagueFilterOptionsReply,
  LeagueFilters as LeagueFilterQuery,
} from "../../api/types";

import { useLeagueFilterValues } from "../../filters/filter-state";
import { LeagueQuickFilters } from "./components/LeagueQuickFilters";
import { LeagueTitle } from "./components/LeagueTitle";

export interface LeagueHeaderProps {
  onChange: (filters: LeagueFilterQuery) => void;
  options: LeagueFilterOptionsReply | undefined;
  total: number | undefined;
}

/*
 * One row owns everything that identifies or narrows the list. A search input
 * parked in the page corner reads as page chrome rather than as a filter, so it
 * sits with the pills that do the same job.
 */
export const LeagueHeader: FC<LeagueHeaderProps> = ({
  onChange,
  options,
  total,
}) => {
  const { t } = useLingui();
  const { filterValues, updateFilters } = useLeagueFilterValues(onChange);

  return (
    <Group align="center" gap="sm">
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
  );
};
