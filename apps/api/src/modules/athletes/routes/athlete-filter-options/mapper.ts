import type { ClubIndex } from "../../club/types.ts";
import type { AthleteFilterOptionsReply } from "./schemas.ts";
import type {
  AthleteFacets,
  AthleteFilterOptionRow,
  FilterOption,
} from "./types.ts";

import { toNumber } from "../../../../lib/numbers.ts";
import { emptyToNull } from "../../../../lib/strings.ts";
import { leaguesForClub } from "../../club/club-utilities.ts";
import { toAthleteLevel, toSportLabel } from "../../sport/classification.ts";

const NCAA_LEAGUE = "NCAA";
const UNKNOWN_LEAGUE = "Other";

const byName = (left: string, right: string): number =>
  left.localeCompare(right);

const countOptions = (
  values: (string | null | undefined)[],
): FilterOption[] => {
  const counts = new Map<string, number>();

  for (const value of values) {
    const option = emptyToNull(value);

    if (option === null) continue;
    counts.set(option, (counts.get(option) ?? 0) + 1);
  }

  return [...counts]
    .map(([value, count]) => ({ count, value }))
    .toSorted((left, right) => {
      const countDifference = right.count - left.count;

      return countDifference === 0
        ? byName(left.value, right.value)
        : countDifference;
    });
};

const scoreBounds = (
  rows: AthleteFilterOptionRow[],
): { max: number | null; min: number | null } => {
  let max: number | null = null;
  let min: number | null = null;

  for (const row of rows) {
    const score = toNumber(row.cm_score);

    if (score === null) continue;
    max = max === null ? score : Math.max(max, score);
    min = min === null ? score : Math.min(min, score);
  }

  return { max, min };
};

const toFacets = (
  row: AthleteFilterOptionRow,
  clubIndex: ClubIndex,
): AthleteFacets | undefined => {
  const rawSport = emptyToNull(row.sport);

  if (rawSport === null) return undefined;

  const level = toAthleteLevel(rawSport);
  const sport = toSportLabel(rawSport);

  if (level === "college") {
    return { club: null, leagues: [NCAA_LEAGUE], level, sport };
  }

  const basketballTeam = emptyToNull(row.basketball_team);

  if (basketballTeam !== null) {
    const basketballLeague = emptyToNull(row.basketball_league);

    return {
      club: basketballTeam,
      leagues: basketballLeague === null ? [] : [basketballLeague],
      level,
      sport,
    };
  }

  const tour = emptyToNull(row.tennis_tour);

  if (tour !== null) return { club: null, leagues: [tour], level, sport };

  const footballClub = emptyToNull(row.football_club);

  return {
    club: footballClub,
    leagues: leaguesForClub(clubIndex, footballClub),
    level,
    sport,
  };
};

const sortedKeys = (source: ReadonlyMap<string, unknown>): string[] =>
  [...source].map(([key]) => key).toSorted(byName);

const sortedRecord = (
  source: ReadonlyMap<string, Set<string>>,
): Record<string, string[]> => {
  const result: Record<string, string[]> = {};

  for (const key of sortedKeys(source)) {
    result[key] = [...(source.get(key) ?? [])].toSorted(byName);
  }

  return result;
};

const addTo = <Key>(
  target: Map<Key, Set<string>>,
  key: Key,
  value: string,
): void => {
  const existing = target.get(key);

  if (existing === undefined) {
    target.set(key, new Set([value]));
  } else {
    existing.add(value);
  }
};

export const toAthleteFilterOptions = (
  rows: AthleteFilterOptionRow[],
  clubIndex: ClubIndex,
): AthleteFilterOptionsReply => {
  const sportsByLevel = new Map<"college" | "professional", Set<string>>([
    ["college", new Set()],
    ["professional", new Set()],
  ]);
  const leaguesBySport = new Map<string, Set<string>>();
  const clubsBySportLeague = new Map<string, Map<string, Set<string>>>();

  for (const row of rows) {
    const facets = toFacets(row, clubIndex);

    if (facets === undefined) continue;

    addTo(sportsByLevel, facets.level, facets.sport);

    for (const league of facets.leagues) {
      addTo(leaguesBySport, facets.sport, league);
    }

    if (facets.club === null) continue;

    let byLeague = clubsBySportLeague.get(facets.sport);

    if (byLeague === undefined) {
      byLeague = new Map();
      clubsBySportLeague.set(facets.sport, byLeague);
    }

    const leagueKeys =
      facets.leagues.length === 0 ? [UNKNOWN_LEAGUE] : facets.leagues;

    for (const league of leagueKeys) {
      addTo(byLeague, league, facets.club);
    }
  }

  const clubsBySport: Record<string, Record<string, string[]>> = {};

  for (const sport of sortedKeys(clubsBySportLeague)) {
    clubsBySport[sport] = sortedRecord(
      clubsBySportLeague.get(sport) ?? new Map(),
    );
  }

  return {
    clubsBySport,
    cmScore: scoreBounds(rows),
    leaguesBySport: sortedRecord(leaguesBySport),
    nationalities: countOptions(rows.map(({ nationality }) => nationality)),
    sports: countOptions(
      rows.map(({ sport }) =>
        sport === null || sport === "" ? null : toSportLabel(sport),
      ),
    ),
    sportsByLevel: {
      college: [...(sportsByLevel.get("college") ?? [])].toSorted(byName),
      professional: [...(sportsByLevel.get("professional") ?? [])].toSorted(
        byName,
      ),
    },
    types: countOptions(rows.map(({ type }) => type)),
  };
};
