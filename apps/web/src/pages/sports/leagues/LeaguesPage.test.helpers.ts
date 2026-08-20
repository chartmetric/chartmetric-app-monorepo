import type { League, LeagueListReply } from "./api/types";

export const buildLeague = (overrides: Partial<League> = {}): League => ({
  country: "United States",
  countryFlagUrl: null,
  id: "1",
  igReach: 12_500_000,
  keyAthletes: [{ id: 1, name: "Alex Morgan" }],
  leagueType: "domestic",
  logoUrl: null,
  name: "Major League Soccer",
  nationalities: ["United States"],
  sport: "football",
  trackedAthletes: 12,
  ...overrides,
});

export const buildReply = (
  leagues: League[] = [buildLeague()],
  total = leagues.length,
): LeagueListReply => ({
  data: leagues,
  meta: { limit: 25, offset: 0, total },
});

export const FILTER_OPTIONS = { sports: ["basketball", "football"] };

export const DEFAULT_QUERY = {
  limit: 25,
  offset: 0,
  sortBy: "name",
  sortDirection: "asc",
} as const;
