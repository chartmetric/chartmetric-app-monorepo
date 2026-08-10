import type {
  AgeGroupVocabularyRow,
  CategoryVocabularyRow,
  CountryVocabularyRow,
  GenderVocabularyRow,
} from "./queries.ts";

import {
  ALLOWED_AGE_GROUPS,
  type InfluencerFilterOptionsReply,
} from "./schemas.ts";

interface FilterOption {
  count: number;
  value: string;
}

const toSortedOptions = (
  rows: { count: number | string; value: string }[],
): FilterOption[] =>
  rows
    .filter(({ value }) => value !== "")
    .map(({ count, value }) => ({ count: Number(count), value }))
    .toSorted((left, right) => {
      const countDifference = right.count - left.count;

      return countDifference === 0
        ? left.value.localeCompare(right.value)
        : countDifference;
    });

// Age groups are defined by the allowed set, not by what the data happens to
// hold, so every supported bucket appears even when its count is zero.
const toAgeGroupOptions = (rows: AgeGroupVocabularyRow[]): FilterOption[] => {
  const countByValue = new Map(
    rows.map((row) => [row.value, Number(row.count)]),
  );

  return ALLOWED_AGE_GROUPS.map((value) => ({
    count: countByValue.get(value) ?? 0,
    value,
  }));
};

export const toInfluencerFilterOptions = (
  categoryRows: CategoryVocabularyRow[],
  countryRows: CountryVocabularyRow[],
  genderRows: GenderVocabularyRow[],
  ageGroupRows: AgeGroupVocabularyRow[],
): InfluencerFilterOptionsReply => ({
  ageGroups: toAgeGroupOptions(ageGroupRows),
  categories: toSortedOptions(categoryRows),
  countries: toSortedOptions(countryRows),
  genders: toSortedOptions(genderRows),
});
