import { useLingui } from "@lingui/react/macro";
import { FilterBar } from "@repo/ui/filter-bar";
import { emptyMultiSelectValue } from "@repo/ui/multi-select-filter";
import { SearchInput } from "@repo/ui/search-input";
import { type FC, useMemo } from "react";

import type {
  AthleteFilterOptionsReply,
  AthleteFilters as AthleteFilterQuery,
} from "../api/types";

import { useAthleteFilterDraft } from "../filters/draft";
import { useAthleteFilterFacets } from "../filters/facets";
import { AthleteEntityFilters } from "./AthleteEntityFilters";
import { AthleteQuickFilters } from "./AthleteQuickFilters";
import { AthleteScoreFilter } from "./AthleteScoreFilter";

export interface AthleteFiltersProps {
  isLoading: boolean;
  onChange: (filters: AthleteFilterQuery) => void;
  options: AthleteFilterOptionsReply | undefined;
}

const useFilterBarLabel = (activeFilterCount: number): string => {
  const { t } = useLingui();
  const activeCount = String(activeFilterCount);

  if (activeFilterCount === 0) return t`Filters`;

  return t({
    comment: "Filter bar heading with the number of active filters",
    message: `Filters (${activeCount})`,
  });
};

export const AthleteFilters: FC<AthleteFiltersProps> = ({
  isLoading,
  onChange,
  options,
}) => {
  const { i18n, t } = useLingui();
  const { activeFilterCount, commit, draft, preview, reset } =
    useAthleteFilterDraft(onChange);
  const countFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.locale, { notation: "compact" }),
    [i18n.locale],
  );
  const filterBarLabel = useFilterBarLabel(activeFilterCount);
  const facets = useAthleteFilterFacets(
    options,
    countFormatter,
    draft.sports.included,
    draft.leagues.included,
  );

  return (
    <FilterBar
      clearLabel={t`Clear filters`}
      label={filterBarLabel}
      onClear={reset}
    >
      <SearchInput
        label={t`Search by name`}
        name="athlete-search"
        onChange={(name) => {
          commit({ ...draft, name });
        }}
        placeholder={t`Search athletes…`}
        value={draft.name}
      />
      <AthleteEntityFilters
        draft={draft}
        isDisabled={isLoading || options === undefined}
        onCategoricalChange={(key, value) => {
          commit({ ...draft, [key]: value });
        }}
        onClubsChange={(values) => {
          commit({ ...draft, clubs: { excluded: [], included: values } });
        }}
        // Narrowing the league set can orphan an already selected team, so the
        // team selection resets whenever the leagues change.
        onLeaguesChange={(values) => {
          commit({
            ...draft,
            clubs: emptyMultiSelectValue(),
            leagues: { excluded: [], included: values },
          });
        }}
        options={facets}
      />
      <AthleteScoreFilter
        bounds={options?.cmScore}
        isLoading={isLoading}
        onChange={(cmScore) => {
          preview({ cmScore });
        }}
        onChangeEnd={(cmScore) => {
          commit({ ...draft, cmScore });
        }}
        value={draft.cmScore}
      />

      <AthleteQuickFilters
        compactFormatter={countFormatter}
        draft={draft}
        onFollowersChange={(followers) => {
          commit({ ...draft, followers });
        }}
        onLevelsChange={(levels) => {
          commit({ ...draft, levels });
        }}
        onVerifiedChange={(isVerified) => {
          commit({ ...draft, isVerified });
        }}
      />
    </FilterBar>
  );
};
