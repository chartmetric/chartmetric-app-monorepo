import type { ClickHouseDatabase } from "../../db/clickhouse/client.ts";
import type { ArtistQueries } from "./types.ts";

export const createArtistQueries = (
  database: ClickHouseDatabase,
): ArtistQueries => ({
  listArtists: (pagination) =>
    database
      .table("new_vertical.cm_artist")
      .select(["id", "name", "image_url", "code2", "record_label"])
      .final()
      .where("is_duplicate", "eq", 0)
      .where("is_non_artist", "eq", 0)
      .orderBy("id", "ASC")
      .limit(pagination.limit)
      .offset(pagination.offset),

  profilesBySourceIds: (sourceIds) =>
    database
      .table("new_vertical.profiles")
      .select(["id", "name", "image_url", "source_id"])
      .final()
      .where((predicate) => predicate.fn<boolean>("isNull", "deleted_at"))
      .where("active", "eq", "true")
      .where("source_id", "in", sourceIds.map(String))
      .orderBy("id", "ASC"),
});
