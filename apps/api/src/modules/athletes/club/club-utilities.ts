import type {
  CatalogEntry,
  ClubCandidate,
  ClubIndex,
  FootballCompetitionRow,
  FootballTeamCompetitionRow,
  FootballTeamRow,
} from "./types.ts";

// `athletes_cache.football_club` stores short/common club names ("Roma", "PSG",
// "Inter Milan") while `teams_apifootball.name` stores official ones ("AS Roma",
// "Paris Saint Germain", "Inter"). These generic club-name tokens are stripped
// before comparing so "Roma" and "AS Roma" reduce to the same token set.
const CLUB_NAME_STOPWORDS: ReadonlySet<string> = new Set([
  "ac",
  "as",
  "athletic",
  "bk",
  "calcio",
  "cd",
  "cf",
  "city",
  "club",
  "de",
  "fc",
  "fk",
  "football",
  "if",
  "olympique",
  "rc",
  "real",
  "sc",
  "sk",
  "sport",
  "sporting",
  "ud",
  "united",
]);

// A bare acronym shares no tokens at all with the spelled-out official name, so
// token-subset matching can never bridge it. Expand known acronyms first.
const CLUB_ACRONYM_ALIASES: Readonly<Record<string, string>> = {
  psg: "paris saint germain",
};

export const normalizeClubTokens = (name: string): Set<string> => {
  const normalized = name
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
  const aliased = CLUB_ACRONYM_ALIASES[normalized] ?? normalized;

  return new Set(
    aliased
      .split(" ")
      .filter((token) => token !== "" && !CLUB_NAME_STOPWORDS.has(token)),
  );
};

const isSubset = (small: Set<string>, large: Set<string>): boolean => {
  for (const token of small) {
    if (!large.has(token)) return false;
  }

  return true;
};

/**
 * Finds the candidate whose token set fully contains, or is fully contained by,
 * the athlete's club token set — {roma} matches "AS Roma" -> {roma}. Returns
 * undefined rather than a wrong guess when neither side is a full subset of the
 * other, which leaves league and crest blank for that athlete.
 */
export const findFuzzyClubMatch = <Candidate extends ClubCandidate>(
  clubName: string,
  candidates: readonly Candidate[],
  tokenCache: Map<string, Set<string>>,
): Candidate | undefined => {
  const clubTokens = normalizeClubTokens(clubName);

  if (clubTokens.size === 0) return undefined;

  let best: Candidate | undefined;
  let bestDifference = Infinity;

  for (const candidate of candidates) {
    let candidateTokens = tokenCache.get(candidate.name);

    if (candidateTokens === undefined) {
      candidateTokens = normalizeClubTokens(candidate.name);
      tokenCache.set(candidate.name, candidateTokens);
    }
    if (candidateTokens.size === 0) continue;

    const [small, large] =
      clubTokens.size <= candidateTokens.size
        ? [clubTokens, candidateTokens]
        : [candidateTokens, clubTokens];

    if (!isSubset(small, large)) continue;

    // Prefer the candidate whose token count is closest to the athlete's club,
    // so {roma} picks "AS Roma" ({roma}) over "Roma W" ({roma, w}); fall back to
    // the shorter official name when two candidates tie.
    const difference = Math.abs(candidateTokens.size - clubTokens.size);

    if (
      difference < bestDifference ||
      (difference === bestDifference &&
        (best === undefined || candidate.name.length < best.name.length))
    ) {
      best = candidate;
      bestDifference = difference;
    }
  }

  return best;
};

const EMPTY: readonly string[] = [];

const addToSet = <Key>(
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

    addToSet(leaguesByTeam, row.team_id, league);
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
