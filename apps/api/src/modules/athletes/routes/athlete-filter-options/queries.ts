import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type {
  DatabaseQueryFactory,
  ExecutableQuery,
} from "../../../../lib/database.ts";
import type { AthleteFilterOptionRow } from "./types.ts";

const listAthleteFilterOptions = ((database) =>
  database
    .table("new_vertical.athletes_cache")
    .final()
    .where("is_active", "eq", 1)
    .where((predicate) => predicate.fn<boolean>("isNull", "deleted_at"))
    // The explicit type argument is required: without it TypeScript resolves
    // the qualified right-hand column before the table name is fixed.
    .leftAnyJoin<"new_vertical.athletes_basketball">(
      "new_vertical.athletes_basketball",
      "profile_id",
      "new_vertical.athletes_basketball.profile_id",
    )
    .select([
      "sport",
      "nationality",
      "type",
      "cm_score",
      "football_club",
      "tennis_tour",
      "new_vertical.athletes_basketball.team AS basketball_team",
      "new_vertical.athletes_basketball.league AS basketball_league",
    ])
    .limit(100_000)
    .settings({
      join_use_nulls: 1,
      max_execution_time: 30,
      max_result_rows: 100_000,
      max_rows_to_read: 10_000_000,
      timeout_before_checking_execution_speed: 0,
    })) satisfies DatabaseQueryFactory;

export const createAthleteFilterOptionsQueries = (
  database: ClickHouseDatabase,
): {
  listAthleteFilterOptions: () => ExecutableQuery<AthleteFilterOptionRow>;
} => ({
  listAthleteFilterOptions: () =>
    listAthleteFilterOptions(
      database,
    ) as unknown as ExecutableQuery<AthleteFilterOptionRow>,
});
