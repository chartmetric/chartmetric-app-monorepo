import { Trans, useLingui } from "@lingui/react/macro";
import {
  Alert,
  Button,
  Center,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type FC, type ReactNode, useState } from "react";

import { loadAthleteFilterOptions } from "./athlete-filter-options-query";
import {
  type AthleteFilters as AthleteFilterQuery,
  type AthleteListQuery,
  type AthleteSortBy,
  DEFAULT_ATHLETE_QUERY,
  loadAthletes,
} from "./athlete-list-query";
import { AthleteFilters } from "./components/AthleteFilters";
import { AthletesTable } from "./components/AthletesTable";

const replaceFilters = (
  query: AthleteListQuery,
  filters: AthleteFilterQuery,
): AthleteListQuery => ({
  limit: query.limit,
  offset: 0,
  sortBy: query.sortBy ?? "cmScore",
  sortDirection: query.sortDirection ?? "desc",
  ...filters,
});

const changeQuerySort = (
  query: AthleteListQuery,
  nextSortBy: AthleteSortBy,
): AthleteListQuery => {
  const currentSortBy = query.sortBy ?? "cmScore";
  const currentDirection = query.sortDirection ?? "desc";
  let nextDirection: "asc" | "desc";

  if (currentSortBy === nextSortBy) {
    nextDirection = currentDirection === "asc" ? "desc" : "asc";
  } else {
    nextDirection = nextSortBy === "cmScore" ? "desc" : "asc";
  }

  return {
    ...query,
    offset: 0,
    sortBy: nextSortBy,
    sortDirection: nextDirection,
  };
};

const LoadingState: FC = () => {
  const { t } = useLingui();

  return (
    <Center mih={280}>
      <Stack align="center" gap="sm" role="status">
        <Loader aria-label={t`Loading athletes`} />
        <Text c="dimmed">
          <Trans>Loading athletes…</Trans>
        </Text>
      </Stack>
    </Center>
  );
};

const EmptyState: FC = () => (
  <Paper p="xl" radius="md" withBorder>
    <Center mih={180}>
      <Stack align="center" gap="xs">
        <Title order={2} size="h3">
          <Trans>No athletes found</Trans>
        </Title>
        <Text c="dimmed">
          <Trans>There are no athletes to show on this page.</Trans>
        </Text>
      </Stack>
    </Center>
  </Paper>
);

interface ErrorStateProps {
  retry: () => void;
}

const ErrorState: FC<ErrorStateProps> = ({ retry }) => (
  <Alert
    color="red"
    title={
      <Trans comment="Error title on the athletes list page">
        Unable to load athletes
      </Trans>
    }
  >
    <Stack align="flex-start" gap="sm">
      <Text>
        <Trans>The athlete list could not be loaded. Try again.</Trans>
      </Text>
      <Button color="red" onClick={retry} variant="light">
        <Trans comment="Button that retries loading the athletes list">
          Try again
        </Trans>
      </Button>
    </Stack>
  </Alert>
);

const FilterOptionsError: FC<ErrorStateProps> = ({ retry }) => (
  <Alert color="yellow" title={<Trans>Unable to load filter options</Trans>}>
    <Stack align="flex-start" gap="sm">
      <Text>
        <Trans>Category filters are temporarily unavailable.</Trans>
      </Text>
      <Button color="yellow" onClick={retry} variant="light">
        <Trans>Retry filter options</Trans>
      </Button>
    </Stack>
  </Alert>
);

export const AthletesPage: FC = () => {
  const [query, setQuery] = useState<AthleteListQuery>(DEFAULT_ATHLETE_QUERY);
  const filterOptionsQuery = useQuery({
    queryFn: loadAthleteFilterOptions,
    queryKey: ["athlete-filter-options"],
    staleTime: 5 * 60 * 1000,
  });
  const athletesQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: async () => await loadAthletes(query),
    queryKey: ["athletes", query],
  });
  const athletes = athletesQuery.data?.data ?? [];
  const offset = query.offset;
  const sortBy = query.sortBy ?? "cmScore";
  const sortDirection = query.sortDirection ?? "desc";
  let content: ReactNode;

  const applyFilters = (filters: AthleteFilterQuery): void => {
    setQuery((currentQuery) => replaceFilters(currentQuery, filters));
  };

  const changeSort = (nextSortBy: AthleteSortBy): void => {
    setQuery((currentQuery) => changeQuerySort(currentQuery, nextSortBy));
  };

  if (athletesQuery.isPending) {
    content = <LoadingState />;
  } else if (athletesQuery.isError) {
    content = (
      <ErrorState
        retry={() => {
          void athletesQuery.refetch();
        }}
      />
    );
  } else if (offset === 0 && athletes.length === 0) {
    content = <EmptyState />;
  } else {
    content = (
      <AthletesTable
        athletes={athletes}
        isFetching={athletesQuery.isFetching}
        offset={offset}
        onPageChange={(nextOffset) => {
          setQuery((currentQuery) => ({
            ...currentQuery,
            offset: nextOffset,
          }));
        }}
        onSort={changeSort}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={1}>
          <Trans>Athletes</Trans>
        </Title>
        <Text c="dimmed" mt={4}>
          <Trans>Explore active athletes across sports.</Trans>
        </Text>
      </div>
      {filterOptionsQuery.isError ? (
        <FilterOptionsError
          retry={() => {
            void filterOptionsQuery.refetch();
          }}
        />
      ) : null}
      <AthleteFilters
        isLoading={filterOptionsQuery.isPending}
        onChange={applyFilters}
        options={filterOptionsQuery.data}
      />
      {content}
    </Stack>
  );
};
