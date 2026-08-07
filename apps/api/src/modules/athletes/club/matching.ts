import type { ClubCandidate } from "./types.ts";

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
