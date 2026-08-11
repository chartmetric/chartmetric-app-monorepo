import type { Test_tv_personsRecord } from "../../../../db/clickhouse/schema.generated.ts";
import type { WarehouseNumber } from "../../../../lib/numbers.ts";

export type ActorListRow = Pick<
  Test_tv_personsRecord,
  "id" | "name" | "popularity" | "profile_path"
> & {
  instagram_handle: string | null;
  instagram_url: string | null;
  instagram_followers: WarehouseNumber;
  role_count: WarehouseNumber;
  known_for: string | null;
};

export interface ActorCountRow {
  total: WarehouseNumber;
}
