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

export interface AthleteFilterDraftState {
  activeFilterCount: number;
  commit: (next: AthleteFilterDraft) => void;
  draft: AthleteFilterDraft;
  /** Updates the draft without querying, for controls that stream while dragging. */
  preview: (next: Partial<AthleteFilterDraft>) => void;
  reset: () => void;
}

export interface AthleteEntityFilterOptions {
  clubs: MultiSelectFilterOption[];
  leagues: MultiSelectFilterOption[];
  nationalities: MultiSelectFilterOption[];
  sports: MultiSelectFilterOption[];
  types: MultiSelectFilterOption[];
}

export type LeaguesBySport = Readonly<Record<string, readonly string[]>>;
export type ClubsBySport = Readonly<
  Record<string, Readonly<Record<string, readonly string[]>>>
>;
