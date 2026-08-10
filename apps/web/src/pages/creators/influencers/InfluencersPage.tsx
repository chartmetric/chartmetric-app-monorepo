import { Plural, Trans } from "@lingui/react/macro";
import { Stack, Text, Title } from "@mantine/core";
import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { type FC, useState } from "react";

import type {
  InfluencerFilters as InfluencerFilterQuery,
  InfluencerListQuery,
  InfluencerListReply,
} from "./types";

import { loadInfluencerFilterOptions } from "./api/filter-options";
import { loadInfluencers } from "./api/influencer-list";
import { InfluencerFilters } from "./components/filters/InfluencerFilters";
import {
  EmptyState,
  ErrorState,
  FilterOptionsError,
  LoadingState,
} from "./components/InfluencersPageStates";
import { InfluencersTable } from "./components/InfluencersTable";
import { DEFAULT_INFLUENCER_QUERY } from "./constants";

interface InfluencersHeaderProps {
  total: number | undefined;
}

const InfluencersHeader: FC<InfluencersHeaderProps> = ({ total }) => (
  <div>
    <Title order={1}>
      <Trans>Influencers</Trans>
    </Title>
    <Text c="dimmed" mt={4}>
      <Trans>Explore influencers across social platforms.</Trans>
    </Text>
    {total === undefined ? null : (
      <Text c="dimmed" mt={4} size="sm">
        <Plural one="# influencer" other="# influencers" value={total} />
      </Text>
    )}
  </div>
);

interface InfluencersContentProps {
  influencersQuery: UseQueryResult<InfluencerListReply>;
  offset: number;
  onPageChange: (offset: number) => void;
}

const InfluencersContent: FC<InfluencersContentProps> = ({
  influencersQuery,
  offset,
  onPageChange,
}) => {
  if (influencersQuery.isPending) return <LoadingState />;
  if (influencersQuery.isError) {
    return (
      <ErrorState
        retry={() => {
          void influencersQuery.refetch();
        }}
      />
    );
  }

  const influencers = influencersQuery.data.data;
  if (offset === 0 && influencers.length === 0) return <EmptyState />;

  return (
    <InfluencersTable
      influencers={influencers}
      isFetching={influencersQuery.isFetching}
      offset={offset}
      onPageChange={onPageChange}
      total={influencersQuery.data.meta.total}
    />
  );
};

const replaceFilters = (
  query: InfluencerListQuery,
  filters: InfluencerFilterQuery,
): InfluencerListQuery => ({
  limit: query.limit,
  offset: 0,
  ...filters,
});

export const InfluencersPage: FC = () => {
  const [query, setQuery] = useState<InfluencerListQuery>(
    DEFAULT_INFLUENCER_QUERY,
  );
  const filterOptionsQuery = useQuery({
    queryFn: loadInfluencerFilterOptions,
    queryKey: ["influencer-filter-options"],
    staleTime: 5 * 60 * 1000,
  });
  const influencersQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: async () => await loadInfluencers(query),
    queryKey: ["influencers", query],
  });

  const changeOffset = (nextOffset: number): void => {
    setQuery((currentQuery) => ({ ...currentQuery, offset: nextOffset }));
  };

  const applyFilters = (filters: InfluencerFilterQuery): void => {
    setQuery((currentQuery) => replaceFilters(currentQuery, filters));
  };

  return (
    <Stack gap="lg">
      <InfluencersHeader total={influencersQuery.data?.meta.total} />
      {filterOptionsQuery.isError ? (
        <FilterOptionsError
          retry={() => {
            void filterOptionsQuery.refetch();
          }}
        />
      ) : null}
      <InfluencerFilters
        isLoading={filterOptionsQuery.isPending}
        onChange={applyFilters}
        options={filterOptionsQuery.data}
      />
      <InfluencersContent
        influencersQuery={influencersQuery}
        offset={query.offset}
        onPageChange={changeOffset}
      />
    </Stack>
  );
};
