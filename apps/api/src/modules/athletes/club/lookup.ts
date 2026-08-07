import type {
  CatalogEntry,
  ClubIndex,
  FootballCompetitionRow,
  FootballTeamCompetitionRow,
  FootballTeamRow,
} from "./types.ts";

import { addToGroup } from "../../../lib/collections.ts";
import { findFuzzyClubMatch } from "./matching.ts";

const EMPTY: readonly string[] = [];

const groupLeaguesByTeam = (
  competitions: readonly FootballCompetitionRow[],
  teamCompetitions: readonly FootballTeamCompetitionRow[],
): Map<number, Set<string>> => {
  const competitionNames = new Map(
    competitions.map((row) => [row.competition_id, row.name]),
  );
  const leaguesByTeam = new Map<number, Set<string>>();

  for (const row of teamCompetitions) {
    const league = competitionNames.get(row.competition_id);

    if (league === undefined || league === "") continue;

    addToGroup(leaguesByTeam, row.team_id, league);
  }

  return leaguesByTeam;
};

const mergeTeamIntoEntry = (
  entry: CatalogEntry,
  leagues: ReadonlySet<string>,
  logoUrl: string | null,
): void => {
  for (const league of leagues) {
    if (!entry.leagues.includes(league)) entry.leagues.push(league);
  }
  entry.logoUrl ??= logoUrl === "" ? null : logoUrl;
};

const buildCatalogEntries = (
  teams: readonly FootballTeamRow[],
  competitions: readonly FootballCompetitionRow[],
  teamCompetitions: readonly FootballTeamCompetitionRow[],
): CatalogEntry[] => {
  const leaguesByTeam = groupLeaguesByTeam(competitions, teamCompetitions);
  // Teams are grouped by name rather than id because the athlete side only
  // carries a club name; two catalog ids sharing a name contribute one entry.
  const byName = new Map<string, CatalogEntry>();
  const entries: CatalogEntry[] = [];

  for (const row of teams) {
    const name = row.name;

    if (typeof name !== "string" || name === "") continue;

    const leagues = leaguesByTeam.get(row.team_id) ?? new Set<string>();
    const existing = byName.get(name);

    if (existing === undefined) {
      const entry: CatalogEntry = {
        leagues: [...leagues],
        logoUrl: row.logo_url === "" ? null : row.logo_url,
        name,
      };

      byName.set(name, entry);
      entries.push(entry);
    } else {
      mergeTeamIntoEntry(existing, leagues, row.logo_url);
    }
  }

  return entries;
};

export const buildClubIndex = (
  teams: readonly FootballTeamRow[],
  competitions: readonly FootballCompetitionRow[],
  teamCompetitions: readonly FootballTeamCompetitionRow[],
  rosterClubNames: readonly (string | null | undefined)[],
): ClubIndex => {
  const entries = buildCatalogEntries(teams, competitions, teamCompetitions);
  const entriesByName = new Map(entries.map((entry) => [entry.name, entry]));
  const tokenCache = new Map<string, Set<string>>();
  const leaguesByClub = new Map<string, readonly string[]>();
  const logoByClub = new Map<string, string | null>();
  const clubsByLeague = new Map<string, string[]>();

  for (const clubName of rosterClubNames) {
    if (typeof clubName !== "string" || clubName === "") continue;
    if (leaguesByClub.has(clubName)) continue;

    const matched =
      entriesByName.get(clubName) ??
      findFuzzyClubMatch(clubName, entries, tokenCache);

    if (matched === undefined) continue;

    const leagues = matched.leagues.toSorted((left, right) =>
      left.localeCompare(right),
    );

    leaguesByClub.set(clubName, leagues);
    logoByClub.set(clubName, matched.logoUrl);

    for (const league of leagues) {
      const clubs = clubsByLeague.get(league);

      if (clubs === undefined) {
        clubsByLeague.set(league, [clubName]);
      } else {
        clubs.push(clubName);
      }
    }
  }

  return { clubsByLeague, leaguesByClub, logoByClub };
};

export const clubsForLeagues = (
  index: ClubIndex,
  leagues: readonly string[],
): string[] => {
  const clubs = new Set<string>();

  for (const league of leagues) {
    const leagueClubs = index.clubsByLeague.get(league) ?? EMPTY;

    for (const club of leagueClubs) clubs.add(club);
  }

  return [...clubs];
};

export const leaguesForClub = (
  index: ClubIndex,
  clubName: string | null,
): readonly string[] =>
  clubName === null ? EMPTY : (index.leaguesByClub.get(clubName) ?? EMPTY);

export const logoForClub = (
  index: ClubIndex,
  clubName: string | null,
): string | null =>
  clubName === null ? null : (index.logoByClub.get(clubName) ?? null);
