import type { WarehouseNumber } from "../../../../lib/numbers.ts";

export interface ActorListRow {
  id: number;
  name: string;
  profile_path: string | null;
  popularity: number;
  instagram_handle: string | null;
  instagram_url: string | null;
  instagram_followers: WarehouseNumber;
  role_count: WarehouseNumber;
  known_for: string | null;
}

export interface ActorCountRow {
  total: WarehouseNumber;
}
