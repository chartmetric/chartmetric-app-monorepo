import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { FilterBar } from "@repo/ui/filter-bar";
import { emptyMultiSelectValue } from "@repo/ui/multi-select-filter";
import { SearchInput } from "@repo/ui/search-input";

import type {
  AthleteFilterOptionsReply,
  AthleteFilters as AthleteFilterQuery,
} from "../../api/types";

import { useListFormatters } from "../../../../../lib/formatting";
import { useAthleteFilterOptions } from "../../filters/filter-options";
import {
  countActiveFilters,
  createEmptyFilterValues,
  useAthleteFilterValues,
} from "../../filters/filter-state";
import { useFilterBarLabel } from "../../filters/formatters";
import { AthleteEntityFilters } from "./components/AthleteEntityFilters";
import { AthleteQuickFilters } from "./components/AthleteQuickFilters/AthleteQuickFilters";
import { AthleteScoreFilter } from "./components/AthleteScoreFilter";

export interface AthleteFiltersProps {
  isLoading: boolean;
  onChange: (filters: AthleteFilterQuery) => void;
  options: AthleteFilterOptionsReply | undefined;
}

export const AthleteFilters: FC<AthleteFiltersProps> = (props) => {
  const { isLoading, onChange, options } = props;
  const { t } = useLingui();
  const { filterValues, setFilterValues, updateFilters } =
    useAthleteFilterValues(onChange);
  const countFormatter = useListFormatters().compact;
  const filterBarLabel = useFilterBarLabel(countActiveFilters(filterValues));
  const filterOptions = useAthleteFilterOptions(
    options,
    countFormatter,
    filterValues.sports.included,
    filterValues.leagues.included,
  );
  return (
    <FilterBar
      clearLabel={t`Clear filters`}
      label={filterBarLabel}
      onClear={() => {
        updateFilters(createEmptyFilterValues());
      }}
      quickFilters={
        <AthleteQuickFilters
          compactFormatter={countFormatter}
          onFollowersChange={(followers) => {
            updateFilters({ ...filterValues, followers });
          }}
          onLevelsChange={(levels) => {
            updateFilters({ ...filterValues, levels });
          }}
          onVerifiedChange={(isVerified) => {
            updateFilters({ ...filterValues, isVerified });
          }}
          values={filterValues}
        />
      }
    >
      <SearchInput
        label={t`Search by name`}
        name="athlete-search"
        onChange={(name) => {
          updateFilters({ ...filterValues, name });
        }}
        placeholder={t`Search athletes…`}
        value={filterValues.name}
      />
      <AthleteEntityFilters
        isDisabled={isLoading || options === undefined}
        onCategoricalChange={(key, value) => {
          updateFilters({ ...filterValues, [key]: value });
        }}
        onClubsChange={(values) => {
          updateFilters({
            ...filterValues,
            clubs: { excluded: [], included: values },
          });
        }}
        // Narrowing the league set can orphan an already selected team, so the
        // team selection resets whenever the leagues change.
        onLeaguesChange={(values) => {
          updateFilters({
            ...filterValues,
            clubs: emptyMultiSelectValue(),
            leagues: { excluded: [], included: values },
          });
        }}
        options={filterOptions}
        values={filterValues}
      />
      <AthleteScoreFilter
        bounds={options?.cmScore}
        isLoading={isLoading}
        onChange={(cmScore) => {
          setFilterValues((current) => ({ ...current, cmScore }));
        }}
        onChangeEnd={(cmScore) => {
          updateFilters({ ...filterValues, cmScore });
        }}
        value={filterValues.cmScore}
      />
    </FilterBar>
  );
};
