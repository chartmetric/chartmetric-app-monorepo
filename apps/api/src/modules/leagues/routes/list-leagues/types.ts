import type { WarehouseNumber } from "../../../../lib/numbers.ts";
import type { selectLeagueCatalog } from "./queries.ts";

/** One key athlete as the aggregate emits it: `(profile_id, name)`. */
export type KeyAthleteTuple = [id: number, name: string];

export interface LeagueListRow {
  id: string;
  name: string | null;
  sport: string | null;
  league_type: string | null;
  scope: string | null;
  logo_url: string | null;
  country_flag_url: string | null;
  tracked_athletes: WarehouseNumber;
  key_athletes: KeyAthleteTuple[];
  nationalities: string[];
}

export interface LeagueCountRow {
  total: number | string;
}

export type LeagueCatalogBuilder = ReturnType<typeof selectLeagueCatalog>;
