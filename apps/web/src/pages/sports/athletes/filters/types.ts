import type {
  MultiSelectFilterOption,
  MultiSelectFilterValue,
} from "@repo/ui/multi-select-filter";
import type { NumericRangeValue } from "@repo/ui/range-filter";

import type { AthleteLevel } from "../api/types";

export interface FollowerRange {
  max: number | null;
  min: number | null;
}

export interface AthleteFilterValues {
  clubs: MultiSelectFilterValue;
  cmScore: NumericRangeValue;
  followers: FollowerRange;
  isVerified: boolean;
  leagues: MultiSelectFilterValue;
  levels: readonly AthleteLevel[];
  name: string;
  nationalities: MultiSelectFilterValue;
  sports: MultiSelectFilterValue;
}

export type CategoricalFilterKey = "nationalities" | "sports";

export interface AthleteEntityFilterOptions {
  clubs: MultiSelectFilterOption[];
  leagues: MultiSelectFilterOption[];
  nationalities: MultiSelectFilterOption[];
  sports: MultiSelectFilterOption[];
}

export type LeaguesBySport = Readonly<Record<string, readonly string[]>>;
export type ClubsBySport = Readonly<
  Record<string, Readonly<Record<string, readonly string[]>>>
>;
