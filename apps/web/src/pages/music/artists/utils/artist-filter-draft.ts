import type { NumericRangeValue } from "@repo/ui/range-filter";

import {
  emptyMultiSelectValue,
  type MultiSelectFilterValue,
} from "@repo/ui/multi-select-filter";

import type { ArtistFilters } from "../types";

export interface ArtistFilterDraft {
  countries: MultiSelectFilterValue;
  genres: MultiSelectFilterValue;
  instagramFollowers: NumericRangeValue;
  name: string;
  tiktokFollowers: NumericRangeValue;
  verifiedOnly: boolean;
}

export const createFilterDraft = (): ArtistFilterDraft => ({
  countries: emptyMultiSelectValue(),
  genres: emptyMultiSelectValue(),
  instagramFollowers: [null, null],
  name: "",
  tiktokFollowers: [null, null],
  verifiedOnly: false,
});

const addCategoricalFilter = (
  filters: ArtistFilters,
  includeKey: "countries" | "genres",
  excludeKey: "excludeCountries" | "excludeGenres",
  selection: MultiSelectFilterValue,
): void => {
  if (selection.included.length > 0) {
    filters[includeKey] = selection.included;
  }
  if (selection.excluded.length > 0) {
    filters[excludeKey] = selection.excluded;
  }
};

export const toFilterQuery = (draft: ArtistFilterDraft): ArtistFilters => {
  const filters: ArtistFilters = {};
  const name = draft.name.trim();

  if (name !== "") filters.name = name;
  addCategoricalFilter(
    filters,
    "countries",
    "excludeCountries",
    draft.countries,
  );
  addCategoricalFilter(filters, "genres", "excludeGenres", draft.genres);
  if (draft.instagramFollowers[0] !== null) {
    filters.minInstagramFollowers = draft.instagramFollowers[0];
  }
  if (draft.instagramFollowers[1] !== null) {
    filters.maxInstagramFollowers = draft.instagramFollowers[1];
  }
  if (draft.tiktokFollowers[0] !== null) {
    filters.minTiktokFollowers = draft.tiktokFollowers[0];
  }
  if (draft.tiktokFollowers[1] !== null) {
    filters.maxTiktokFollowers = draft.tiktokFollowers[1];
  }
  if (draft.verifiedOnly) filters.verifiedOnly = true;

  return filters;
};
