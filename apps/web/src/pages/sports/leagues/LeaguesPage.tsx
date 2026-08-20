import { Stack } from "@mantine/core";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type FC, useState } from "react";

import type { LeagueListQuery } from "./api/types";

import { loadLeagueFilterOptions } from "./api/filter-options";
import { DEFAULT_LEAGUE_QUERY, loadLeagues } from "./api/league-list";
import { LeagueHeader } from "./components/LeagueHeader/LeagueHeader";
import { LeagueListContent } from "./components/LeagueListContent";
import { LeagueFilterOptionsError } from "./components/LeagueListStates/LeagueFilterOptionsError";
import { changeQuerySort, replaceFilters } from "./filters/sort-state";

const FILTER_OPTIONS_STALE_TIME_MS = 5 * 60 * 1000;

export const LeaguesPage: FC = () => {
  const [query, setQuery] = useState<LeagueListQuery>(DEFAULT_LEAGUE_QUERY);
  const filterOptionsQuery = useQuery({
    queryFn: loadLeagueFilterOptions,
    queryKey: ["league-filter-options"],
    staleTime: FILTER_OPTIONS_STALE_TIME_MS,
  });
  const leaguesQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: async () => await loadLeagues(query),
    queryKey: ["leagues", query],
  });
  const sortBy = query.sortBy ?? DEFAULT_LEAGUE_QUERY.sortBy;
  const sortDirection =
    query.sortDirection ?? DEFAULT_LEAGUE_QUERY.sortDirection;

  return (
    <Stack gap="md">
      {filterOptionsQuery.isError ? (
        <LeagueFilterOptionsError
          retry={() => {
            void filterOptionsQuery.refetch();
          }}
        />
      ) : null}
      <LeagueHeader
        onChange={(filters) => {
          setQuery((current) => replaceFilters(current, filters));
        }}
        options={filterOptionsQuery.data}
        total={leaguesQuery.data?.meta.total}
      />
      <LeagueListContent
        offset={query.offset}
        onPageChange={(offset) => {
          setQuery((current) => ({ ...current, offset }));
        }}
        onSort={(nextSortBy) => {
          setQuery((current) => changeQuerySort(current, nextSortBy));
        }}
        query={leaguesQuery}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Stack>
  );
};
