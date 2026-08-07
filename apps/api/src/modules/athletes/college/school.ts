import { rawAs } from "@hypequery/clickhouse";

import type { ClickHouseDatabase } from "../../../db/clickhouse/client.ts";
import type {
  DatabaseQueryFactory,
  JoinableChain,
} from "../../../lib/database.ts";

export const ON3_SCHOOL = "on3_school";

/**
 * The school an on3 college athlete plays for.
 *
 * `updated_at` is outside this table's sorting key, so `argMax` over it already
 * returns the newest version of a row — what `.final()` would do here, at less
 * cost. The extraction has no builder form: `argMax` takes a column rather than
 * an expression, so it stays raw. That SQL is constant and reaches no request
 * value.
 */
const selectOn3School = ((database) =>
  database
    .table("new_vertical.profile_sport_external_ids")
    .where("provider", "eq", "on3")
    .whereNotNull("metadata")
    .groupBy("profile_id")
    .select([
      "profile_id",
      rawAs<string, "school">(
        "argMax(JSONExtractString(assumeNotNull(metadata), 'school'), updated_at)",
        "school",
      ),
    ])) satisfies DatabaseQueryFactory;

const CACHE_PROFILE_ID = "new_vertical.athletes_cache.profile_id";

/**
 * Registers the school subquery and joins it to `athletes_cache`. Callers read
 * its column as `on3_school.school`, which the generated schema cannot describe,
 * so they select it with `rawAs`.
 */
export const withOn3School = <Builder>(
  builder: Builder,
  database: ClickHouseDatabase,
): Builder => {
  const next = (builder as unknown as JoinableChain)
    .withCTE(ON3_SCHOOL, selectOn3School(database))
    .leftAnyJoin(ON3_SCHOOL, CACHE_PROFILE_ID, `${ON3_SCHOOL}.profile_id`);

  return next as unknown as Builder;
};

export { selectOn3School };
