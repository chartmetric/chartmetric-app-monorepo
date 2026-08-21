import type { DataTableColumn } from "@repo/ui/data-table";

import type { League, LeagueSortBy } from "../api/types";

/** A league paired with its position in the whole filtered result set. */
export interface LeagueRow {
  league: League;
  ordinal: number;
}

export type LeagueTableColumn = DataTableColumn<LeagueRow, LeagueSortBy>;
