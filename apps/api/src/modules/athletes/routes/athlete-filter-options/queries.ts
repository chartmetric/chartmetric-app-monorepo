import { rawAs } from "@hypequery/clickhouse";

import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type {
  DatabaseQueryFactory,
  ExecutableQuery,
} from "../../../../lib/database.ts";
import type { AthleteFilterOptionRow } from "./types.ts";

import { withBasketballRoster } from "../../basketball/roster.ts";

const listAthleteFilterOptions = ((database) =>
  withBasketballRoster(
    database
      .table("new_vertical.athletes_cache")
      .final()
      .where("is_active", "eq", 1)
      .where((predicate) => predicate.fn<boolean>("isNull", "deleted_at")),
    database,
  )
    .select([
      "sport",
      "nationality",
      "type",
      "cm_score",
      "football_club",
      "tennis_tour",
      rawAs<string, "basketball_team">(
        "basketball_roster.basketball_team",
        "basketball_team",
      ),
      rawAs<string, "basketball_league">(
        "basketball_roster.basketball_league",
        "basketball_league",
      ),
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
