import type { League, ListLeaguesQuery, ListLeaguesReply } from "./schemas.ts";
import type { KeyAthleteTuple, LeagueListRow } from "./types.ts";

import { compareNames } from "../../../../lib/filter-options.ts";
import { toNumber } from "../../../../lib/numbers.ts";
import { emptyToNull } from "../../../../lib/strings.ts";

// A competition with no home country stores its scope as "world" or "World";
// every other value is a country name.
const WORLD_SCOPE = "world";

const toCountry = (scope: string | null): string | null => {
  const value = emptyToNull(scope);

  return value === null || value.toLowerCase() === WORLD_SCOPE ? null : value;
};

const toKeyAthletes = (
  entries: readonly KeyAthleteTuple[],
): League["keyAthletes"] =>
  entries.flatMap(([id, rawName]) => {
    const name = emptyToNull(rawName);

    return name === null ? [] : [{ id, name }];
  });

const toNationalities = (values: readonly string[]): string[] => {
  const nationalities = new Set<string>();

  for (const value of values) {
    const nationality = emptyToNull(value);

    if (nationality !== null) nationalities.add(nationality);
  }

  return [...nationalities].toSorted(compareNames);
};

export const toLeague = (row: LeagueListRow): League => ({
  country: toCountry(row.scope),
  countryFlagUrl: emptyToNull(row.country_flag_url),
  id: row.id,
  igReach: toNumber(row.aggregated_ig_followers) ?? 0,
  keyAthletes: toKeyAthletes(row.key_athletes),
  leagueType: emptyToNull(row.league_type),
  logoUrl: emptyToNull(row.logo_url),
  name: emptyToNull(row.name),
  nationalities: toNationalities(row.nationalities),
  sport: emptyToNull(row.sport),
  trackedAthletes: toNumber(row.tracked_athletes) ?? 0,
});

export const toLeagueList = (
  rows: LeagueListRow[],
  pagination: ListLeaguesQuery,
  total: number,
): ListLeaguesReply => ({
  data: rows.map((row) => toLeague(row)),
  meta: {
    limit: pagination.limit,
    offset: pagination.offset,
    total,
  },
});
