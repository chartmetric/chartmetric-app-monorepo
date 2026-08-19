import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type {
  DatabaseQueryFactory,
  ExecutableQuery,
} from "../../../../lib/database.ts";
import type { LeagueFilterOptionRow } from "./types.ts";

const listLeagueFilterOptions = ((database) =>
  database
    .table("new_vertical.leagues")
    .final()
    .where("vertical", "eq", "sports")
    .groupBy("sport")
    .select(["sport"])
    .settings({
      max_execution_time: 30,
      max_rows_to_read: 10_000_000,
      timeout_before_checking_execution_speed: 0,
    })) satisfies DatabaseQueryFactory;

export const createLeagueFilterOptionsQueries = (
  database: ClickHouseDatabase,
): {
  listLeagueFilterOptions: () => ExecutableQuery<LeagueFilterOptionRow>;
} => ({
  listLeagueFilterOptions: () =>
    listLeagueFilterOptions(
      database,
    ) as unknown as ExecutableQuery<LeagueFilterOptionRow>,
});
