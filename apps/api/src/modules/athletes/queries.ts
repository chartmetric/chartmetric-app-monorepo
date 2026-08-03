import type { ClickHouseDatabase } from "../../db/clickhouse/client.ts";
import type { ListAthletesQuery } from "./list-athletes-query.ts";

const sortColumns = {
  cmScore: "cm_score",
  name: "name",
  nationality: "nationality",
  sport: "sport",
  type: "type",
} as const;

type AthleteQueriesFactory = (database: ClickHouseDatabase) => unknown;

export const createAthleteQueries = ((database) => ({
  listAthletes: (query: ListAthletesQuery) => {
    let builder = database
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
      .where((predicate) => predicate.fn<boolean>("isNull", "deleted_at"));

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

    for (const [column, value] of [
      ["sport", query.sport],
      ["nationality", query.nationality],
      ["type", query.type],
    ] as const) {
      if (value !== undefined) {
        builder = builder.where((predicate) =>
          predicate.fn<boolean>(
            "equals",
            predicate.fn<string>("lowerUTF8", predicate.col(column)),
            predicate.fn<string>("lowerUTF8", predicate.value(value)),
          ),
        );
      }
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
      .orderBy(
        sortColumns[sortBy],
        sortDirection.toUpperCase() as "ASC" | "DESC",
      )
      .orderBy("profile_id", "ASC")
      .limit(query.limit)
      .offset(query.offset)
      .settings({
        max_execution_time: 30,
        max_rows_to_read: 10_000_000,
        timeout_before_checking_execution_speed: 0,
      });
  },
})) satisfies AthleteQueriesFactory;

export type AthleteQueries = ReturnType<typeof createAthleteQueries>;

export type AthleteRow = Awaited<
  ReturnType<ReturnType<AthleteQueries["listAthletes"]>["execute"]>
>[number];
