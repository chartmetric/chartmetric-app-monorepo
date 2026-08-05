import type { MultiSelectFilterOption } from "@repo/ui/multi-select-filter";

export type LeaguesBySport = Readonly<Record<string, readonly string[]>>;
export type ClubsBySport = Readonly<
  Record<string, Readonly<Record<string, readonly string[]>>>
>;

const byName = (left: string, right: string): number =>
  left.localeCompare(right);

export const toCountedOptions = (
  options: readonly { count: number; value: string }[],
  countFormatter: Intl.NumberFormat,
): MultiSelectFilterOption[] =>
  options.map(({ count, value }) => ({
    description: countFormatter.format(count),
    label: value,
    value,
  }));

export const toPlainOptions = (
  values: readonly string[],
): MultiSelectFilterOption[] =>
  values.map((value) => ({ label: value, value }));

const scopedSports = (
  available: readonly string[],
  selectedSports: readonly string[],
): readonly string[] =>
  selectedSports.length > 0 ? selectedSports : available.toSorted(byName);

export const flattenLeagues = (
  leaguesBySport: LeaguesBySport,
  selectedSports: readonly string[],
): string[] => {
  const sports = scopedSports(Object.keys(leaguesBySport), selectedSports);
  const leagues = new Set<string>();

  for (const sport of sports) {
    const sportLeagues = leaguesBySport[sport] ?? [];

    for (const league of sportLeagues) leagues.add(league);
  }

  return [...leagues].toSorted(byName);
};

const clubsForSport = (
  byLeague: Readonly<Record<string, readonly string[]>>,
  selectedLeagues: readonly string[],
): string[] =>
  Object.entries(byLeague)
    .filter(
      ([league]) =>
        selectedLeagues.length === 0 || selectedLeagues.includes(league),
    )
    .flatMap(([, names]) => [...names]);

export const flattenClubs = (
  clubsBySport: ClubsBySport,
  selectedSports: readonly string[],
  selectedLeagues: readonly string[],
): string[] => {
  const sports = scopedSports(Object.keys(clubsBySport), selectedSports);
  const clubs = new Set<string>();

  for (const sport of sports) {
    const byLeague = clubsBySport[sport];

    if (byLeague === undefined) continue;

    for (const club of clubsForSport(byLeague, selectedLeagues)) {
      clubs.add(club);
    }
  }

  return [...clubs].toSorted(byName);
};
