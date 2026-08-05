import { useLingui } from "@lingui/react/macro";
import { TextInput } from "@mantine/core";
import { FilterBar } from "@repo/ui/filter-bar";
import { emptyMultiSelectValue } from "@repo/ui/multi-select-filter";
import { type FC, useMemo } from "react";

import type { AthleteFilterOptionsReply } from "../athlete-filter-options-query";
import type { AthleteFilters as AthleteFilterQuery } from "../athlete-list-query";

import { useAthleteFilterDraft } from "../use-athlete-filter-draft";
import { useAthleteFilterFacets } from "../use-athlete-filter-facets";
import { AthleteEntityFilters } from "./AthleteEntityFilters";
import { AthleteQuickFilters } from "./AthleteQuickFilters";
import { AthleteScoreFilter } from "./AthleteScoreFilter";

export interface AthleteFiltersProps {
  isLoading: boolean;
  onChange: (filters: AthleteFilterQuery) => void;
  options: AthleteFilterOptionsReply | undefined;
}

interface SearchFieldProps {
  onChange: (name: string) => void;
  value: string;
}

const SearchField: FC<SearchFieldProps> = ({ onChange, value }) => {
  const { t } = useLingui();

  return (
    <TextInput
      aria-label={t`Search by name`}
      autoComplete="off"
      name="athlete-search"
      onChange={(event) => {
        onChange(event.currentTarget.value);
      }}
      placeholder={t`Search athletes…`}
      value={value}
      w={{ base: "100%", sm: 220 }}
    />
  );
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
  const activeCount = String(activeFilterCount);
  const countedLabel = t({
    comment: "Filter bar heading with the number of active filters",
    message: `Filters (${activeCount})`,
  });
  const facets = useAthleteFilterFacets(
    options,
    countFormatter,
    draft.sports.included,
    draft.leagues.included,
  );

  return (
    <FilterBar
      clearLabel={t`Clear filters`}
      label={activeFilterCount === 0 ? t`Filters` : countedLabel}
      onClear={reset}
    >
      <SearchField
        onChange={(name) => {
          commit({ ...draft, name });
        }}
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
        onLeaguesChange={(values) => {
          // Narrowing the league set can orphan an already selected team, so the
          // team selection resets whenever the leagues change.
          commit({
            ...draft,
            clubs: emptyMultiSelectValue(),
            leagues: { excluded: [], included: values },
          });
        }}
        options={facets}
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
    </FilterBar>
  );
};
