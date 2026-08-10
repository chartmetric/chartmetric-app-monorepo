import { Trans } from "@lingui/react/macro";
import { Stack, Text, Title } from "@mantine/core";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type FC, useState } from "react";

import type { ActorListQuery } from "./api/types";

import { DEFAULT_ACTOR_QUERY, loadActors } from "./api/actor-list";
import { ActorListContent } from "./components/ActorListContent";
import { changeQuerySort } from "./sort-state";

export const ActorsPage: FC = () => {
  const [query, setQuery] = useState<ActorListQuery>(DEFAULT_ACTOR_QUERY);
  const actorsQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: async () => await loadActors(query),
    queryKey: ["actors", query],
  });

  return (
    <Stack gap="lg">
      <div>
        <Title order={1}>
          <Trans>Actors</Trans>
        </Title>
        <Text c="dimmed" mt={4}>
          <Trans>Explore actors across TV and movies.</Trans>
        </Text>
      </div>
      <ActorListContent
        offset={query.offset}
        onPageChange={(offset) => {
          setQuery((current) => ({ ...current, offset }));
        }}
        onSort={(sortBy) => {
          setQuery((current) => changeQuerySort(current, sortBy));
        }}
        query={actorsQuery}
        sortBy={query.sortBy ?? DEFAULT_ACTOR_QUERY.sortBy}
        sortDirection={query.sortDirection ?? DEFAULT_ACTOR_QUERY.sortDirection}
      />
    </Stack>
  );
};
