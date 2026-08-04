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

import {
  type ArtistListQuery,
  type ArtistSortBy,
  DEFAULT_ARTIST_QUERY,
  loadArtists,
} from "./artist-list-query";
import { ArtistsTable } from "./components/ArtistsTable";

const DESCENDING_FIRST_SORTS: ReadonlySet<ArtistSortBy> = new Set([
  "cmScore",
  "instagramFollowers",
  "tiktokFollowers",
]);

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
    nextDirection = DESCENDING_FIRST_SORTS.has(nextSortBy) ? "desc" : "asc";
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
  const artistsQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: async () => await loadArtists(query),
    queryKey: ["artists", query],
  });
  const artists = artistsQuery.data?.data ?? [];
  const offset = query.offset;
  const sortBy = query.sortBy ?? "cmScore";
  const sortDirection = query.sortDirection ?? "desc";
  let content: ReactNode;

  const changeSort = (nextSortBy: ArtistSortBy): void => {
    setQuery((currentQuery) => changeQuerySort(currentQuery, nextSortBy));
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
        isFetching={artistsQuery.isFetching}
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
          <Trans>Artists</Trans>
        </Title>
        <Text c="dimmed" mt={4}>
          <Trans>Explore artists across the music industry.</Trans>
        </Text>
      </div>
      {content}
    </Stack>
  );
};
