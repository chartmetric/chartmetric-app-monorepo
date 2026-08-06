import type { DatabaseQueryFactory } from "../../../../db/clickhouse/client.ts";

const listAthleteFilterOptions = ((database) =>
  database
    .table("new_vertical.athletes_cache")
    .select(["sport", "nationality", "type", "cm_score"])
    .final()
    .where("is_active", "eq", 1)
    .where((predicate) => predicate.fn<boolean>("isNull", "deleted_at"))
    .limit(100_000)
    .settings({
      max_execution_time: 30,
      max_result_rows: 100_000,
      max_rows_to_read: 1_000_000,
      timeout_before_checking_execution_speed: 0,
    })) satisfies DatabaseQueryFactory;

export const createAthleteFilterOptionsQueries = ((database) => ({
  listAthleteFilterOptions: () => listAthleteFilterOptions(database),
})) satisfies DatabaseQueryFactory;

type AthleteFilterOptionsQueries = ReturnType<
  typeof createAthleteFilterOptionsQueries
>;

export type AthleteFilterOptionRow = Awaited<
  ReturnType<
    ReturnType<
      AthleteFilterOptionsQueries["listAthleteFilterOptions"]
    >["execute"]
  >
>[number];
