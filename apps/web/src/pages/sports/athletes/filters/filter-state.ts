import {
  emptyMultiSelectValue,
  type MultiSelectFilterValue,
} from "@repo/ui/multi-select-filter";
import { type Dispatch, type SetStateAction, useState } from "react";

import type { AthleteFilters } from "../api/types";
import type { AthleteFilterValues, CategoricalFilterKey } from "./types";

export const createEmptyFilterValues = (): AthleteFilterValues => ({
  clubs: emptyMultiSelectValue(),
  cmScore: [null, null],
  followers: { max: null, min: null },
  isVerified: false,
  leagues: emptyMultiSelectValue(),
  levels: [],
  name: "",
  nationalities: emptyMultiSelectValue(),
  sports: emptyMultiSelectValue(),
  types: emptyMultiSelectValue(),
});

const hasSelection = (selection: MultiSelectFilterValue): boolean =>
  selection.included.length > 0 || selection.excluded.length > 0;

export const countActiveFilters = (values: AthleteFilterValues): number =>
  [
    values.name.trim() !== "",
    hasSelection(values.sports),
    hasSelection(values.nationalities),
    hasSelection(values.types),
    hasSelection(values.leagues),
    hasSelection(values.clubs),
    values.levels.length > 0,
    values.isVerified,
    values.followers.min !== null || values.followers.max !== null,
    values.cmScore[0] !== null || values.cmScore[1] !== null,
  ].filter(Boolean).length;

const EXCLUDE_KEYS = {
  nationalities: "excludeNationalities",
  sports: "excludeSports",
  types: "excludeTypes",
} as const;

const addCategoricalFilter = (
  filters: AthleteFilters,
  key: CategoricalFilterKey,
  selection: MultiSelectFilterValue,
): void => {
  if (selection.included.length > 0) filters[key] = [...selection.included];
  if (selection.excluded.length > 0) {
    filters[EXCLUDE_KEYS[key]] = [...selection.excluded];
  }
};

export const toFilterQuery = (values: AthleteFilterValues): AthleteFilters => {
  const filters: AthleteFilters = {};
  const name = values.name.trim();
  const [minCmScore, maxCmScore] = values.cmScore;

  if (name !== "") filters.name = name;
  if (minCmScore !== null) filters.minCmScore = minCmScore;
  if (maxCmScore !== null) filters.maxCmScore = maxCmScore;
  if (values.followers.min !== null)
    filters.minFollowers = values.followers.min;
  if (values.followers.max !== null)
    filters.maxFollowers = values.followers.max;
  if (values.isVerified) filters.verified = true;
  if (values.levels.length > 0) filters.levels = [...values.levels];
  // League and team have no exclude mode: both resolve through the football club
  // catalog, which only answers which clubs belong to a set of leagues.
  if (values.leagues.included.length > 0) filters.leagues = [...values.leagues.included];
  if (values.clubs.included.length > 0) filters.clubs = [...values.clubs.included];

  for (const key of ["nationalities", "sports", "types"] as const) {
    addCategoricalFilter(filters, key, values[key]);
  }

  return filters;
};

export const useAthleteFilterValues = (
  onChange: (filters: AthleteFilters) => void,
): {
  filterValues: AthleteFilterValues;
  setFilterValues: Dispatch<SetStateAction<AthleteFilterValues>>;
  updateFilters: (next: AthleteFilterValues) => void;
} => {
  const [filterValues, setFilterValues] = useState(createEmptyFilterValues);
  const updateFilters = (next: AthleteFilterValues): void => {
    setFilterValues(next);
    onChange(toFilterQuery(next));
  };

  return { filterValues, setFilterValues, updateFilters };
};
