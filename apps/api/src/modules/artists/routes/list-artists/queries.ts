import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type { PaginationQuery } from "../../../../lib/pagination.ts";

type ListArtistsQueriesFactory = (database: ClickHouseDatabase) => unknown;

export const createListArtistsQueries = ((database) => ({
  listArtists: (pagination: PaginationQuery) =>
    database
      .table("new_vertical.cm_artist")
      .select(["id", "name", "image_url", "code2", "record_label"])
      .final()
      .where("is_duplicate", "eq", 0)
      .where("is_non_artist", "eq", 0)
      .orderBy("id", "ASC")
      .limit(pagination.limit)
      .offset(pagination.offset),

  profilesBySourceIds: (sourceIds: number[]) =>
    database
      .table("new_vertical.profiles")
      .select(["id", "name", "image_url", "source_id"])
      .final()
      .where((predicate) => predicate.fn<boolean>("isNull", "deleted_at"))
      .where("active", "eq", "true")
      .where("source_id", "in", sourceIds.map(String))
      .orderBy("id", "ASC"),
})) satisfies ListArtistsQueriesFactory;

type ListArtistsQueries = ReturnType<typeof createListArtistsQueries>;
export type ArtistRow = Awaited<
  ReturnType<ReturnType<ListArtistsQueries["listArtists"]>["execute"]>
>[number];
export type ProfileRow = Awaited<
  ReturnType<ReturnType<ListArtistsQueries["profilesBySourceIds"]>["execute"]>
>[number];
