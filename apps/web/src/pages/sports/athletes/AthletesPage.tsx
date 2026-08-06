import { Trans } from "@lingui/react/macro";
import { Group, Stack, Text, Title } from "@mantine/core";
import { usePersistentState } from "@repo/ui/use-persistent-state";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type FC, useState } from "react";

import type { AthleteListQuery } from "./api/types";
import type { AthleteColumnKey, AthleteColumnPreset } from "./columns/types";

import { DEFAULT_ATHLETE_QUERY, loadAthletes } from "./api/athlete-list";
import { loadAthleteFilterOptions } from "./api/filter-options";
import { DEFAULT_ATHLETE_COLUMNS } from "./columns/registry";
import {
  ATHLETE_COLUMN_GROUPS_STORAGE_KEY,
  ATHLETE_COLUMNS_STORAGE_KEY,
  isAthleteColumnKeyList,
  isAthleteColumnPresetList,
} from "./columns/storage";
import { AthleteColumnPicker } from "./components/AthleteColumnPicker";
import { AthleteFilters } from "./components/AthleteFilters/AthleteFilters";
import { AthleteListContent } from "./components/AthleteListContent";
import { AthleteFilterOptionsError } from "./components/AthleteListStates/AthleteFilterOptionsError";
import { changeQuerySort, replaceFilters } from "./filters/sort-state";

const FILTER_OPTIONS_STALE_TIME_MS = 5 * 60 * 1000;

const EMPTY_PRESETS: AthleteColumnPreset[] = [];

export const AthletesPage: FC = () => {
  const [query, setQuery] = useState<AthleteListQuery>(DEFAULT_ATHLETE_QUERY);
  const [visibleColumns, setVisibleColumns] = usePersistentState<
    AthleteColumnKey[]
  >(
    ATHLETE_COLUMNS_STORAGE_KEY,
    [...DEFAULT_ATHLETE_COLUMNS],
    isAthleteColumnKeyList,
  );
  const [customPresets, setCustomPresets] = usePersistentState<
    AthleteColumnPreset[]
  >(
    ATHLETE_COLUMN_GROUPS_STORAGE_KEY,
    EMPTY_PRESETS,
    isAthleteColumnPresetList,
  );
  const filterOptionsQuery = useQuery({
    queryFn: loadAthleteFilterOptions,
    queryKey: ["athlete-filter-options"],
    staleTime: FILTER_OPTIONS_STALE_TIME_MS,
  });
  const athletesQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: async () => await loadAthletes(query),
    queryKey: ["athletes", query],
  });

  return (
    <Stack gap="lg">
      <Group align="flex-start" justify="space-between" wrap="wrap">
        <div>
          <Title order={1}>
            <Trans>Athletes</Trans>
          </Title>
          <Text c="dimmed" mt={4}>
            <Trans>Explore active athletes across sports.</Trans>
          </Text>
        </div>
        <AthleteColumnPicker
          customPresets={customPresets}
          onChange={setVisibleColumns}
          onCustomPresetsChange={setCustomPresets}
          value={visibleColumns}
        />
      </Group>
      {filterOptionsQuery.isError ? (
        <AthleteFilterOptionsError
          retry={() => {
            void filterOptionsQuery.refetch();
          }}
        />
      ) : null}
      <AthleteFilters
        isLoading={filterOptionsQuery.isPending}
        onChange={(filters) => {
          setQuery((current) => replaceFilters(current, filters));
        }}
        options={filterOptionsQuery.data}
      />
      <AthleteListContent
        offset={query.offset}
        onPageChange={(offset) => {
          setQuery((current) => ({ ...current, offset }));
        }}
        onSort={(sortBy) => {
          setQuery((current) => changeQuerySort(current, sortBy));
        }}
        query={athletesQuery}
        sortBy={query.sortBy ?? "rank"}
        sortDirection={query.sortDirection ?? "asc"}
        visibleColumns={visibleColumns}
      />
    </Stack>
  );
};
