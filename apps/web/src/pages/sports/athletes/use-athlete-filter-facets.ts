import { useMemo } from "react";

import type { AthleteFilterOptionsReply } from "./athlete-filter-options-query";
import type { AthleteEntityFilterOptions } from "./components/AthleteEntityFilters";

import {
  flattenClubs,
  flattenLeagues,
  toCountedOptions,
  toPlainOptions,
} from "./athlete-filter-facets";

export const useAthleteFilterFacets = (
  options: AthleteFilterOptionsReply | undefined,
  countFormatter: Intl.NumberFormat,
  selectedSports: readonly string[],
  selectedLeagues: readonly string[],
): AthleteEntityFilterOptions =>
  useMemo(
    () => ({
      clubs: toPlainOptions(
        flattenClubs(
          options?.clubsBySport ?? {},
          selectedSports,
          selectedLeagues,
        ),
      ),
      leagues: toPlainOptions(
        flattenLeagues(options?.leaguesBySport ?? {}, selectedSports),
      ),
      nationalities: toCountedOptions(
        options?.nationalities ?? [],
        countFormatter,
      ),
      sports: toCountedOptions(options?.sports ?? [], countFormatter),
      types: toCountedOptions(options?.types ?? [], countFormatter),
    }),
    [countFormatter, options, selectedLeagues, selectedSports],
  );
