import { Trans, useLingui } from "@lingui/react/macro";
import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type FC, type ReactNode, useState } from "react";

import type {
  ArtistChangePeriod,
  ArtistListQuery,
  ArtistListReply,
  ArtistSortBy,
  MetricDisplayMode,
} from "./types";

import { apiClient } from "../../../api/client";
import { ArtistsTable } from "./components/ArtistsTable";
import { DEFAULT_ARTIST_QUERY, METRIC_SORTS, sortFamilyOf } from "./constants";

const loadArtists = async (
  query: ArtistListQuery,
): Promise<ArtistListReply> => {
  const result = await apiClient.GET("/app/artists", {
    params: { query },
  });

  if (result.data === undefined) {
    throw new Error("Artist request failed");
  }

  return result.data;
};

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

const LoadingState: FC = () => {
  const { t } = useLingui();

  return (
    <Center mih={280}>
      <Stack align="center" gap="sm" role="status">
        <Loader aria-label={t`Loading artists`} />
        <Text c="dimmed">
          <Trans>Loading artists…</Trans>
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
          <Trans>No artists found</Trans>
        </Title>
        <Text c="dimmed">
          <Trans>There are no artists to show on this page.</Trans>
        </Text>
      </Stack>
    </Center>
  </Paper>
);

interface ErrorStateProps {
  retry: () => void;
}

interface MetricDisplayControlsProps {
  changePeriod: ArtistChangePeriod;
  displayMode: MetricDisplayMode;
  onChangePeriod: (value: string) => void;
  onDisplayModeChange: (value: string) => void;
}

const MetricDisplayControls: FC<MetricDisplayControlsProps> = ({
  changePeriod,
  displayMode,
  onChangePeriod,
  onDisplayModeChange,
}) => {
  const { t } = useLingui();

  return (
    <Group gap="sm" justify="flex-end">
      <SegmentedControl
        aria-label={t`Change period`}
        data={[
          { label: t`1D`, value: "1d" },
          { label: t`7D`, value: "7d" },
          { label: t`28D`, value: "28d" },
        ]}
        disabled={displayMode === "total"}
        onChange={onChangePeriod}
        size="xs"
        value={changePeriod}
      />
      <SegmentedControl
        aria-label={t`Value display`}
        data={[
          { label: t`Total`, value: "total" },
          { label: t`Change`, value: "change" },
          { label: t`% Change`, value: "percentChange" },
        ]}
        onChange={onDisplayModeChange}
        size="xs"
        value={displayMode}
      />
    </Group>
  );
};

const ErrorState: FC<ErrorStateProps> = ({ retry }) => (
  <Alert
    color="red"
    title={
      <Trans comment="Error title on the artists list page">
        Unable to load artists
      </Trans>
    }
  >
    <Stack align="flex-start" gap="sm">
      <Text>
        <Trans>The artist list could not be loaded. Try again.</Trans>
      </Text>
      <Button color="red" onClick={retry} variant="light">
        <Trans comment="Button that retries loading the artists list">
          Try again
        </Trans>
      </Button>
    </Stack>
  </Alert>
);

export const ArtistsPage: FC = () => {
  const [query, setQuery] = useState<ArtistListQuery>(DEFAULT_ARTIST_QUERY);
  const [displayMode, setDisplayMode] = useState<MetricDisplayMode>("total");
  const artistsQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: async () => await loadArtists(query),
    queryKey: ["artists", query],
  });
  const artists = artistsQuery.data?.data ?? [];
  const offset = query.offset;
  const sortBy = query.sortBy ?? "cmScore";
  const sortDirection = query.sortDirection ?? "desc";
  const changePeriod = query.changePeriod ?? "7d";
  let content: ReactNode;

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

  if (artistsQuery.isPending) {
    content = <LoadingState />;
  } else if (artistsQuery.isError) {
    content = (
      <ErrorState
        retry={() => {
          void artistsQuery.refetch();
        }}
      />
    );
  } else if (offset === 0 && artists.length === 0) {
    content = <EmptyState />;
  } else {
    content = (
      <ArtistsTable
        artists={artists}
        displayMode={displayMode}
        isFetching={artistsQuery.isFetching}
        offset={offset}
        onPageChange={changeOffset}
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
          <Trans>Artists</Trans>
        </Title>
        <Text c="dimmed" mt={4}>
          <Trans>Explore artists across the music industry.</Trans>
        </Text>
      </div>
      <MetricDisplayControls
        changePeriod={changePeriod}
        displayMode={displayMode}
        onChangePeriod={changeChangePeriod}
        onDisplayModeChange={changeDisplayMode}
      />
      {content}
    </Stack>
  );
};
