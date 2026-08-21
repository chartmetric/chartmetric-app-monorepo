import {
  toCountedFilterOptions,
  toFilterOptions,
} from "@repo/ui/multi-select-filter";
import { useMemo } from "react";

import type { AthleteFilterOptionsReply } from "../api/types";
import type {
  AthleteEntityFilterOptions,
  ClubsBySport,
  LeaguesBySport,
} from "./types";

import { useNameComparator } from "../../../../lib/collation";
import { toSportLabel } from "../../sport-labels";

type Compare = (left: string, right: string) => number;

const scopedSports = (
  available: readonly string[],
  selectedSports: readonly string[],
  compare: Compare,
): readonly string[] =>
  selectedSports.length > 0 ? selectedSports : available.toSorted(compare);

const flattenLeagues = (
  leaguesBySport: LeaguesBySport,
  selectedSports: readonly string[],
  compare: Compare,
): string[] => {
  const sports = scopedSports(
    Object.keys(leaguesBySport),
    selectedSports,
    compare,
  );
  const leagues = sports.flatMap((sport) => leaguesBySport[sport] ?? []);

  return [...new Set(leagues)].toSorted(compare);
};

const flattenClubs = (
  clubsBySport: ClubsBySport,
  selectedSports: readonly string[],
  selectedLeagues: readonly string[],
  compare: Compare,
): string[] => {
  const sports = scopedSports(
    Object.keys(clubsBySport),
    selectedSports,
    compare,
  );
  const clubs = sports.flatMap((sport) =>
    Object.entries(clubsBySport[sport] ?? {})
      .filter(
        ([league]) =>
          selectedLeagues.length === 0 || selectedLeagues.includes(league),
      )
      .flatMap(([, names]) => names),
  );

  return [...new Set(clubs)].toSorted(compare);
};

export const useAthleteFilterOptions = (
  options: AthleteFilterOptionsReply | undefined,
  countFormatter: Intl.NumberFormat,
  selectedSports: readonly string[],
  selectedLeagues: readonly string[],
): AthleteEntityFilterOptions => {
  const compare = useNameComparator();

  return useMemo(() => {
    const formatCount = (count: number): string => countFormatter.format(count);

    return {
      clubs: toFilterOptions(
        flattenClubs(
          options?.clubsBySport ?? {},
          selectedSports,
          selectedLeagues,
          compare,
        ),
      ),
      leagues: toFilterOptions(
        flattenLeagues(options?.leaguesBySport ?? {}, selectedSports, compare),
      ),
      nationalities: toCountedFilterOptions(
        options?.nationalities ?? [],
        formatCount,
      ),
      sports: toCountedFilterOptions(options?.sports ?? [], formatCount).map(
        (option) => ({ ...option, label: toSportLabel(option.value) }),
      ),
    };
  }, [compare, countFormatter, options, selectedLeagues, selectedSports]);
};
