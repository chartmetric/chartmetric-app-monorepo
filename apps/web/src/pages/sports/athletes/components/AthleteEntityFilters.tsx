import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import {
  MultiSelectFilter,
  type MultiSelectFilterOption,
  type MultiSelectFilterValue,
} from "@repo/ui/multi-select-filter";

import type {
  AthleteFilterDraft,
  CategoricalFilterKey,
} from "../athlete-filter-draft";

export interface AthleteEntityFilterOptions {
  clubs: MultiSelectFilterOption[];
  leagues: MultiSelectFilterOption[];
  nationalities: MultiSelectFilterOption[];
  sports: MultiSelectFilterOption[];
  types: MultiSelectFilterOption[];
}

export interface AthleteEntityFiltersProps {
  draft: AthleteFilterDraft;
  isDisabled: boolean;
  onCategoricalChange: (
    key: CategoricalFilterKey,
    value: MultiSelectFilterValue,
  ) => void;
  onClubsChange: (values: string[]) => void;
  onLeaguesChange: (values: string[]) => void;
  options: AthleteEntityFilterOptions;
}

export const AthleteEntityFilters: FC<AthleteEntityFiltersProps> = ({
  draft,
  isDisabled,
  onCategoricalChange,
  onClubsChange,
  onLeaguesChange,
  options,
}) => {
  const { t } = useLingui();
  const shared = {
    disabled: isDisabled,
    emptyMessage: t`No matching options`,
    excludeLabel: t`Exclude`,
    includeLabel: t`Include`,
  };
  const categorical: readonly [CategoricalFilterKey, string, string][] = [
    ["sports", t`Sport`, t`Find a sport…`],
    ["nationalities", t`Nationality`, t`Find a nationality…`],
    ["types", t`Type`, t`Find a type…`],
  ];

  return (
    <>
      {categorical.map(([key, label, searchPlaceholder]) => (
        <MultiSelectFilter
          key={key}
          {...shared}
          label={label}
          onChange={(value) => {
            onCategoricalChange(key, value);
          }}
          options={options[key]}
          searchPlaceholder={searchPlaceholder}
          value={draft[key]}
        />
      ))}
      {/* League and team resolve through the football club catalog, which only
          answers which clubs belong to a set of leagues — there is no exclude
          for it to express, so the control is not offered. */}
      <MultiSelectFilter
        {...shared}
        canExclude={false}
        label={t`League`}
        onChange={(value) => {
          onLeaguesChange(value.included);
        }}
        options={options.leagues}
        searchPlaceholder={t`Find a league…`}
        value={draft.leagues}
      />
      <MultiSelectFilter
        {...shared}
        canExclude={false}
        label={t`Team`}
        onChange={(value) => {
          onClubsChange(value.included);
        }}
        options={options.clubs}
        searchPlaceholder={t`Find a team…`}
        value={draft.clubs}
      />
    </>
  );
};
