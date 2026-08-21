import type { LeagueFilterOptionsReply } from "./schemas.ts";
import type { LeagueFilterOptionRow } from "./types.ts";

import { compareNames } from "../../../../lib/filter-options.ts";
import { emptyToNull } from "../../../../lib/strings.ts";

export const toLeagueFilterOptions = (
  rows: LeagueFilterOptionRow[],
): LeagueFilterOptionsReply => {
  const sports = new Set<string>();

  for (const row of rows) {
    const sport = emptyToNull(row.sport);

    if (sport !== null) sports.add(sport);
  }

  return { sports: [...sports].toSorted(compareNames) };
};
