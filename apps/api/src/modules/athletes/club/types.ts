export interface FootballTeamRow {
  team_id: number;
  name: string | null;
  logo_url: string | null;
}

export interface FootballCompetitionRow {
  competition_id: number;
  name: string;
}

export interface FootballTeamCompetitionRow {
  team_id: number;
  competition_id: number;
}

export interface RosterClubNameRow {
  football_club: string | null;
}

export interface CatalogQuery<Row> {
  execute: () => Promise<Row[]>;
}

export interface ClubCatalogQueries {
  listCompetitions: () => CatalogQuery<FootballCompetitionRow>;
  listRosterClubNames: () => CatalogQuery<RosterClubNameRow>;
  listTeamCompetitions: () => CatalogQuery<FootballTeamCompetitionRow>;
  listTeams: () => CatalogQuery<FootballTeamRow>;
}

export interface ClubCatalog {
  load: () => Promise<ClubIndex>;
}

export interface ClubCandidate {
  name: string;
}

export interface CatalogEntry {
  name: string;
  leagues: string[];
  logoUrl: string | null;
}

export interface ClubIndex {
  leaguesByClub: ReadonlyMap<string, readonly string[]>;
  logoByClub: ReadonlyMap<string, string | null>;
  clubsByLeague: ReadonlyMap<string, readonly string[]>;
}
