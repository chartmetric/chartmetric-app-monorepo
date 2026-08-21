import {
  emptyMultiSelectValue,
  type MultiSelectFilterValue,
} from "@repo/ui/multi-select-filter";

import type { InfluencerFilters } from "../types";

export interface InfluencerFilterDraft {
  ageGroups: MultiSelectFilterValue;
  categories: MultiSelectFilterValue;
  countries: MultiSelectFilterValue;
  genders: MultiSelectFilterValue;
  handle: string;
}

export const createFilterDraft = (): InfluencerFilterDraft => ({
  ageGroups: emptyMultiSelectValue(),
  categories: emptyMultiSelectValue(),
  countries: emptyMultiSelectValue(),
  genders: emptyMultiSelectValue(),
  handle: "",
});

type StringArrayFilterKey =
  | "categories"
  | "countries"
  | "excludeCategories"
  | "excludeCountries"
  | "excludeGenders"
  | "genders";

const addCategoricalFilter = (
  filters: InfluencerFilters,
  includeKey: Extract<
    StringArrayFilterKey,
    "categories" | "countries" | "genders"
  >,
  excludeKey: Extract<
    StringArrayFilterKey,
    "excludeCategories" | "excludeCountries" | "excludeGenders"
  >,
  selection: MultiSelectFilterValue,
): void => {
  if (selection.included.length > 0) filters[includeKey] = selection.included;
  if (selection.excluded.length > 0) filters[excludeKey] = selection.excluded;
};

type AgeGroupSelection = NonNullable<InfluencerFilters["ageGroups"]>;

// The age-group control is populated only from the filter-options vocabulary,
// which the API restricts to the six supported buckets, so its selected values
// are always valid members of the age-group union.
const addAgeGroupFilter = (
  filters: InfluencerFilters,
  selection: MultiSelectFilterValue,
): void => {
  if (selection.included.length > 0) {
    filters.ageGroups = selection.included as AgeGroupSelection;
  }
  if (selection.excluded.length > 0) {
    filters.excludeAgeGroups = selection.excluded as AgeGroupSelection;
  }
};

export const toFilterQuery = (
  draft: InfluencerFilterDraft,
): InfluencerFilters => {
  const filters: InfluencerFilters = {};
  const handle = draft.handle.trim();

  if (handle !== "") filters.handle = handle;
  addCategoricalFilter(
    filters,
    "categories",
    "excludeCategories",
    draft.categories,
  );
  addCategoricalFilter(
    filters,
    "countries",
    "excludeCountries",
    draft.countries,
  );
  addCategoricalFilter(filters, "genders", "excludeGenders", draft.genders);
  addAgeGroupFilter(filters, draft.ageGroups);

  return filters;
};
