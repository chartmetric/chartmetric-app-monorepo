import type { NumericRangeValue } from "@repo/ui/range-filter";

import {
  emptyMultiSelectValue,
  type MultiSelectFilterValue,
} from "@repo/ui/multi-select-filter";

import type { AthleteFilters, AthleteLevel } from "./athlete-list-query";

export interface FollowerRange {
  max: number | null;
  min: number | null;
}

export interface AthleteFilterDraft {
  clubs: MultiSelectFilterValue;
  cmScore: NumericRangeValue;
  followers: FollowerRange;
  isVerified: boolean;
  leagues: MultiSelectFilterValue;
  levels: readonly AthleteLevel[];
  name: string;
  nationalities: MultiSelectFilterValue;
  sports: MultiSelectFilterValue;
  types: MultiSelectFilterValue;
}

export type CategoricalFilterKey = "nationalities" | "sports" | "types";



export const createFilterDraft = (): AthleteFilterDraft => ({
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

export const countActiveFilters = (draft: AthleteFilterDraft): number =>
  [
    draft.name.trim() !== "",
    hasSelection(draft.sports),
    hasSelection(draft.nationalities),
    hasSelection(draft.types),
    hasSelection(draft.leagues),
    hasSelection(draft.clubs),
    draft.levels.length > 0,
    draft.isVerified,
    draft.followers.min !== null || draft.followers.max !== null,
    draft.cmScore[0] !== null || draft.cmScore[1] !== null,
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

export const toFilterQuery = (draft: AthleteFilterDraft): AthleteFilters => {
  const filters: AthleteFilters = {};
  const name = draft.name.trim();
  const [minCmScore, maxCmScore] = draft.cmScore;

  if (name !== "") filters.name = name;
  if (minCmScore !== null) filters.minCmScore = minCmScore;
  if (maxCmScore !== null) filters.maxCmScore = maxCmScore;
  if (draft.followers.min !== null) filters.minFollowers = draft.followers.min;
  if (draft.followers.max !== null) filters.maxFollowers = draft.followers.max;
  if (draft.isVerified) filters.verified = true;
  if (draft.levels.length > 0) filters.levels = [...draft.levels];
  // League and team have no exclude mode: both resolve through the football club
  // catalog, which only answers which clubs belong to a set of leagues.
  if (draft.leagues.included.length > 0) {
    filters.leagues = [...draft.leagues.included];
  }
  if (draft.clubs.included.length > 0) {
    filters.clubs = [...draft.clubs.included];
  }

  for (const key of ["nationalities", "sports", "types"] as const) {
    addCategoricalFilter(filters, key, draft[key]);
  }

  return filters;
};
