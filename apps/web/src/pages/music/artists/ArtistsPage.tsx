import { Trans } from "@lingui/react/macro";
import { Stack, Text, Title } from "@mantine/core";
import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { type FC, useState } from "react";

import type {
  ArtistChangePeriod,
  ArtistFilters as ArtistFilterQuery,
  ArtistListQuery,
  ArtistListReply,
  ArtistSortBy,
  MetricDisplayMode,
} from "./types";

import { loadArtists } from "./api/artist-list";
import { loadArtistFilterOptions } from "./api/filter-options";
import { ArtistFilters } from "./components/ArtistFilters";
import {
  EmptyState,
  ErrorState,
  FilterOptionsError,
  LoadingState,
} from "./components/ArtistsPageStates";
import { ArtistsTable } from "./components/ArtistsTable";
import { MetricDisplayControls } from "./components/MetricDisplayControls";
import { DEFAULT_ARTIST_QUERY, METRIC_SORTS, sortFamilyOf } from "./constants";

const ASCENDING_FIRST_SORTS: ReadonlySet<ArtistSortBy> = new Set([
  "name",
  "countryCode",
]);

const CHANGE_PERIODS: readonly ArtistChangePeriod[] = ["1d", "7d", "28d"];
const METRIC_DISPLAY_MODES: readonly MetricDisplayMode[] = [
  "total",
  "change",
  "percentChange",
];

const isChangePeriod = (value: string): value is ArtistChangePeriod =>
  (CHANGE_PERIODS as readonly string[]).includes(value);

const isMetricDisplayMode = (value: string): value is MetricDisplayMode =>
  (METRIC_DISPLAY_MODES as readonly string[]).includes(value);

const applyDisplayMode = (
  query: ArtistListQuery,
  mode: MetricDisplayMode,
): ArtistListQuery => {
  const family = sortFamilyOf(query.sortBy ?? "cmScore");
  if (family === null) return query;

  return {
    ...query,
    offset: 0,
    sortBy: METRIC_SORTS[family][mode],
  };
};

const replaceFilters = (
  query: ArtistListQuery,
  filters: ArtistFilterQuery,
): ArtistListQuery => ({
  changePeriod: query.changePeriod ?? "7d",
  limit: query.limit,
  offset: 0,
  sortBy: query.sortBy ?? "cmScore",
  sortDirection: query.sortDirection ?? "desc",
  ...filters,
});

const changeQuerySort = (
  query: ArtistListQuery,
  nextSortBy: ArtistSortBy,
): ArtistListQuery => {
  const currentSortBy = query.sortBy ?? "cmScore";
  const currentDirection = query.sortDirection ?? "desc";
  let nextDirection: "asc" | "desc";

  if (currentSortBy === nextSortBy) {
    nextDirection = currentDirection === "asc" ? "desc" : "asc";
  } else {
    nextDirection = ASCENDING_FIRST_SORTS.has(nextSortBy) ? "asc" : "desc";
  }

  return {
    ...query,
    offset: 0,
    sortBy: nextSortBy,
    sortDirection: nextDirection,
  };
};

interface ArtistsContentProps {
  artistsQuery: UseQueryResult<ArtistListReply>;
  displayMode: MetricDisplayMode;
  offset: number;
  onPageChange: (offset: number) => void;
  onSort: (sortBy: ArtistSortBy) => void;
  sortBy: ArtistSortBy;
  sortDirection: "asc" | "desc";
}

const ArtistsContent: FC<ArtistsContentProps> = ({
  artistsQuery,
  displayMode,
  offset,
  onPageChange,
  onSort,
  sortBy,
  sortDirection,
}) => {
  if (artistsQuery.isPending) return <LoadingState />;
  if (artistsQuery.isError) {
    return (
      <ErrorState
        retry={() => {
          void artistsQuery.refetch();
        }}
      />
    );
  }

  const artists = artistsQuery.data.data;
  if (offset === 0 && artists.length === 0) return <EmptyState />;

  return (
    <ArtistsTable
      artists={artists}
      displayMode={displayMode}
      isFetching={artistsQuery.isFetching}
      offset={offset}
      onPageChange={onPageChange}
      onSort={onSort}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

const ArtistsHeader: FC = () => (
  <div>
    <Title order={1}>
      <Trans>Artists</Trans>
    </Title>
    <Text c="dimmed" mt={4}>
      <Trans>Explore artists across the music industry.</Trans>
    </Text>
  </div>
);

export const ArtistsPage: FC = () => {
  const [query, setQuery] = useState<ArtistListQuery>(DEFAULT_ARTIST_QUERY);
  const [displayMode, setDisplayMode] = useState<MetricDisplayMode>("total");
  const filterOptionsQuery = useQuery({
    queryFn: loadArtistFilterOptions,
    queryKey: ["artist-filter-options"],
    staleTime: 5 * 60 * 1000,
  });
  const artistsQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: async () => await loadArtists(query),
    queryKey: ["artists", query],
  });

  const changeSort = (nextSortBy: ArtistSortBy): void => {
    setQuery((currentQuery) => changeQuerySort(currentQuery, nextSortBy));
  };

  const changeOffset = (nextOffset: number): void => {
    setQuery((currentQuery) => ({ ...currentQuery, offset: nextOffset }));
  };

  const changeDisplayMode = (value: string): void => {
    if (!isMetricDisplayMode(value)) return;

    setDisplayMode(value);
    setQuery((currentQuery) => applyDisplayMode(currentQuery, value));
  };

  const changeChangePeriod = (value: string): void => {
    if (!isChangePeriod(value)) return;

    setQuery((currentQuery) => ({
      ...currentQuery,
      changePeriod: value,
      offset: 0,
    }));
  };

  const applyFilters = (filters: ArtistFilterQuery): void => {
    setQuery((currentQuery) => replaceFilters(currentQuery, filters));
  };

  return (
    <Stack gap="lg">
      <ArtistsHeader />
      {filterOptionsQuery.isError ? (
        <FilterOptionsError
          retry={() => {
            void filterOptionsQuery.refetch();
          }}
        />
      ) : null}
      <ArtistFilters
        isLoading={filterOptionsQuery.isPending}
        onChange={applyFilters}
        options={filterOptionsQuery.data}
      />
      <MetricDisplayControls
        changePeriod={query.changePeriod ?? "7d"}
        displayMode={displayMode}
        onChangePeriod={changeChangePeriod}
        onDisplayModeChange={changeDisplayMode}
      />
      <ArtistsContent
        artistsQuery={artistsQuery}
        displayMode={displayMode}
        offset={query.offset}
        onPageChange={changeOffset}
        onSort={changeSort}
        sortBy={query.sortBy ?? "cmScore"}
        sortDirection={query.sortDirection ?? "desc"}
      />
    </Stack>
  );
};
