import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type { ListAthletesQuery } from "./schemas.ts";

const sortColumns = {
  cmScore: "cm_score",
  name: "name",
  nationality: "nationality",
  sport: "sport",
  type: "type",
} as const;

type DatabaseQueryFactory = (database: ClickHouseDatabase) => unknown;
type ListAthletesQueryFactory = (
  database: ClickHouseDatabase,
  query: ListAthletesQuery,
) => unknown;

const selectAthletes = ((database) =>
  database
    .table("new_vertical.athletes_cache")
    .select([
      "profile_id",
      "name",
      "image_url",
      "sport",
      "nationality",
      "type",
      "cm_score",
    ])
    .final()
    .where("is_active", "eq", 1)
    .where((predicate) =>
      predicate.fn<boolean>("isNull", "deleted_at"),
    )) satisfies DatabaseQueryFactory;

const listAthletes = ((database, query) => {
  let builder = selectAthletes(database);

  if (query.name !== undefined) {
    const name = query.name;

    builder = builder.where((predicate) =>
      predicate.fn<boolean>(
        "notEquals",
        predicate.fn<number>(
          "positionCaseInsensitiveUTF8",
          predicate.col("name"),
          predicate.value(name),
        ),
        predicate.value(0),
      ),
    );
  }

  if (query.sports !== undefined) {
    builder = builder.where("sport", "in", query.sports);
  }
  if (query.nationalities !== undefined) {
    builder = builder.where("nationality", "in", query.nationalities);
  }
  if (query.types !== undefined) {
    builder = builder.where("type", "in", query.types);
  }
  if (query.excludeSports !== undefined) {
    builder = builder.where("sport", "notIn", query.excludeSports);
  }
  if (query.excludeNationalities !== undefined) {
    builder = builder.where("nationality", "notIn", query.excludeNationalities);
  }
  if (query.excludeTypes !== undefined) {
    builder = builder.where("type", "notIn", query.excludeTypes);
  }
  if (query.minCmScore !== undefined) {
    builder = builder.where("cm_score", "gte", query.minCmScore);
  }
  if (query.maxCmScore !== undefined) {
    builder = builder.where("cm_score", "lte", query.maxCmScore);
  }

  const sortBy = query.sortBy ?? "cmScore";
  const sortDirection = query.sortDirection ?? "desc";

  return builder
    .orderBy(sortColumns[sortBy], sortDirection.toUpperCase() as "ASC" | "DESC")
    .orderBy("profile_id", "ASC")
    .limit(query.limit)
    .offset(query.offset)
    .settings({
      max_execution_time: 30,
      max_rows_to_read: 10_000_000,
      timeout_before_checking_execution_speed: 0,
    });
}) satisfies ListAthletesQueryFactory;

export const createListAthletesQueries = ((database) => ({
  listAthletes: (query: ListAthletesQuery) => listAthletes(database, query),
})) satisfies DatabaseQueryFactory;

type ListAthletesQueries = ReturnType<typeof createListAthletesQueries>;

export type AthleteRow = Awaited<
  ReturnType<ReturnType<ListAthletesQueries["listAthletes"]>["execute"]>
>[number];
