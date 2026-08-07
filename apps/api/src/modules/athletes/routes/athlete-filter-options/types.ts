import type { AthleteLevel } from "../../sport/types.ts";

/**
 * Declared rather than inferred: hypequery cannot type an alias applied to a
 * joined table's column, so the row shape is stated here and the mapper's
 * annotated return type keeps it tied to the response contract.
 */
export interface AthleteFilterOptionRow {
  basketball_league: string | null;
  basketball_team: string | null;
  cm_score: number | null;
  football_club: string | null;
  nationality: string | null;
  on3_school: string | null;
  sport: string | null;
  tennis_tour: string | null;
}

/** One athlete's values for each dimension the filter options are grouped by. */
export interface AthleteFilterValues {
  club: string | null;
  leagues: readonly string[];
  level: AthleteLevel;
  sport: string;
}
