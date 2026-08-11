import { rawAs } from "@hypequery/clickhouse";

import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type {
  DatabaseQueryFactory,
  ExecutableQuery,
  JoinableChain,
} from "../../../../lib/database.ts";
import type { ListActorsQuery } from "./schemas.ts";
import type { ActorCountRow, ActorListRow } from "./types.ts";

const PERSONS = "new_vertical.test_tv_persons";

const CREDIT_SUMMARY = "credit_summary";
const INSTAGRAM = "instagram";
const TITLES = "titles";

const QUERY_SETTINGS = {
  join_algorithm: "auto",
  join_use_nulls: 1,
  max_bytes_to_read: 50_000_000_000,
  max_execution_time: 30,
  max_result_rows: 10_000,
  max_rows_to_read: 100_000_000,
  timeout_before_checking_execution_speed: 0,
} as const;

const selectInstagram = ((database) =>
  database
    .table("new_vertical.test_tv_person_socials")
    .final()
    .where("platform", "eq", "instagram")
    .select([
      "person_id",
      "handle as instagram_handle",
      "url as instagram_url",
      "followers as instagram_followers",
    ])) satisfies DatabaseQueryFactory;

const selectTitles = ((database) =>
  database
    .table("new_vertical.test_tv_titles")
    .final()
    .select([
      "id",
      "kind",
      "name",
      "network",
      "popularity",
    ])) satisfies DatabaseQueryFactory;

const joinTitles = <Builder>(builder: Builder): Builder =>
  (builder as unknown as JoinableChain).innerJoin(
    TITLES,
    "title_id",
    `${TITLES}.id`,
  ) as unknown as Builder;

const selectCreditSummary = ((database) =>
  joinTitles(
    database
      .table("new_vertical.test_tv_credits")
      .withCTE(TITLES, selectTitles(database))
      .final(),
  )
    .select([
      "person_id",
      // hypequery has no builders for tuple-distinct or tuple-array aggregates.
      rawAs<number, "role_count">(
        "uniqExact(tuple(title_id, title_kind, character))",
        "role_count",
      ),
      rawAs<string, "known_for">(
        "toJSONString(arraySlice(arraySort(x -> (-x.1, x.2, x.3, x.4), groupArray(tuple(titles.popularity, title_id, title_kind, character, titles.name, titles.network))), 1, 2))",
        "known_for",
      ),
    ])
    // Load-bearing dedupe, not a filter: the titles CTE dedupes by its
    // (kind, id) sorting key, so FINAL cannot reduce it to one row per id
    // and the title_id join alone can match a movie and a show sharing an
    // id. This predicate completes the join key.
    .where((predicate) =>
      predicate.fn(
        "equals",
        predicate.col("title_kind"),
        predicate.raw(`${TITLES}.kind`),
      ),
    )
    .where("credit_type", "eq", "cast")
    .groupBy("person_id")) satisfies DatabaseQueryFactory;

const joinActorSources = <Builder>(builder: Builder): Builder =>
  (builder as unknown as JoinableChain)
    .innerJoin(CREDIT_SUMMARY, "id", `${CREDIT_SUMMARY}.person_id`)
    .leftAnyJoin(
      INSTAGRAM,
      "id",
      `${INSTAGRAM}.person_id`,
    ) as unknown as Builder;

const selectActors = ((database) =>
  joinActorSources(
    database
      .table(PERSONS)
      .withCTE(INSTAGRAM, selectInstagram(database))
      .withCTE(CREDIT_SUMMARY, selectCreditSummary(database))
      .final(),
  )) satisfies DatabaseQueryFactory;

const sortColumns = {
  instagramFollowers: `${INSTAGRAM}.instagram_followers`,
  name: `${PERSONS}.name`,
  popularity: `${PERSONS}.popularity`,
  roleCount: `${CREDIT_SUMMARY}.role_count`,
} as const;

const orderActors = <Builder>(
  builder: Builder,
  query: ListActorsQuery,
): Builder => {
  const column = sortColumns[query.sortBy ?? "instagramFollowers"];

  return (builder as unknown as JoinableChain)
    .orderBy(`${column} IS NULL`, "ASC")
    .orderBy(
      column,
      (query.sortDirection ?? "desc").toUpperCase() as "ASC" | "DESC",
    )
    .orderBy(`${PERSONS}.id`, "ASC") as unknown as Builder;
};

const listActors = (
  database: ClickHouseDatabase,
  query: ListActorsQuery,
): ExecutableQuery<ActorListRow> =>
  orderActors(
    selectActors(database).select([
      `${PERSONS}.id AS id`,
      `${PERSONS}.name AS name`,
      `${PERSONS}.profile_path AS profile_path`,
      `${PERSONS}.popularity AS popularity`,
      // CTE aliases are absent from the generated schema used by select().
      rawAs(`${INSTAGRAM}.instagram_handle`, "instagram_handle"),
      rawAs(`${INSTAGRAM}.instagram_url`, "instagram_url"),
      rawAs(`${INSTAGRAM}.instagram_followers`, "instagram_followers"),
      rawAs(`${CREDIT_SUMMARY}.role_count`, "role_count"),
      rawAs(`${CREDIT_SUMMARY}.known_for`, "known_for"),
    ]),
    query,
  )
    .limit(query.limit)
    .offset(query.offset)
    .settings(QUERY_SETTINGS) as unknown as ExecutableQuery<ActorListRow>;

const countActors = (
  database: ClickHouseDatabase,
): ExecutableQuery<ActorCountRow> =>
  selectActors(database)
    .select([rawAs<number, "total">("count()", "total")])
    .settings(QUERY_SETTINGS) as unknown as ExecutableQuery<ActorCountRow>;

export const createListActorsQueries = (
  database: ClickHouseDatabase,
): {
  countActors: () => ExecutableQuery<ActorCountRow>;
  listActors: (query: ListActorsQuery) => ExecutableQuery<ActorListRow>;
} => ({
  countActors: () => countActors(database),
  listActors: (query: ListActorsQuery) => listActors(database, query),
});
