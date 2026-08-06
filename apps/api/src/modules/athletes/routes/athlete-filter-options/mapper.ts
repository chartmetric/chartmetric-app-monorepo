import type { ClubIndex } from "../../club/types.ts";
import type { AthleteFilterOptionsReply } from "./schemas.ts";
import type { AthleteFacets, AthleteFilterOptionRow } from "./types.ts";

import {
  addToGroup,
  compareNames,
  countValues,
  sortedKeys,
  toSortedRecord,
} from "../../../../lib/filter-options.ts";
import { toNumber } from "../../../../lib/numbers.ts";
import { emptyToNull } from "../../../../lib/strings.ts";
import { leaguesForClub } from "../../club/club-utilities.ts";
import { toAthleteLevel, toSportLabel } from "../../sport/classification.ts";

const NCAA_LEAGUE = "NCAA";
const UNKNOWN_LEAGUE = "Other";

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

    addToGroup(sportsByLevel, facets.level, facets.sport);

    for (const league of facets.leagues) {
      addToGroup(leaguesBySport, facets.sport, league);
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
      addToGroup(byLeague, league, facets.club);
    }
  }

  const clubsBySport: Record<string, Record<string, string[]>> = {};

  for (const sport of sortedKeys(clubsBySportLeague)) {
    clubsBySport[sport] = toSortedRecord(
      clubsBySportLeague.get(sport) ?? new Map(),
    );
  }

  return {
    clubsBySport,
    cmScore: scoreBounds(rows),
    leaguesBySport: toSortedRecord(leaguesBySport),
    nationalities: countValues(rows.map(({ nationality }) => nationality)),
    sports: countValues(
      rows.map(({ sport }) =>
        sport === null || sport === "" ? null : toSportLabel(sport),
      ),
    ),
    sportsByLevel: {
      college: [...(sportsByLevel.get("college") ?? [])].toSorted(compareNames),
      professional: [...(sportsByLevel.get("professional") ?? [])].toSorted(
        compareNames,
      ),
    },
    types: countValues(rows.map(({ type }) => type)),
  };
};
