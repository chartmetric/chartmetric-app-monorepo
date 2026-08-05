import type { DatabaseQueryFactory } from "../../../../lib/database.ts";

const optionSettings = {
  max_execution_time: 30,
  max_result_rows: 10_000,
  max_rows_to_read: 10_000_000,
} as const;

const countryOptions = ((database) =>
  database
    .table("new_vertical.cm_artist")
    .final()
    .select(["code2"])
    .count("id", "count")
    .where("is_duplicate", "eq", 0)
    .where("is_non_artist", "eq", 0)
    .where((predicate) =>
      predicate.fn<boolean>(
        "notEquals",
        predicate.col("code2"),
        predicate.value(""),
      ),
    )
    .groupBy("code2")
    .settings(optionSettings)) satisfies DatabaseQueryFactory;

const genreOptions = ((database) =>
  database
    .table("new_vertical.l_cm_artist_tag")
    .select(["tag_slug"])
    .countDistinct("cm_artist", "count")
    .where("tag_type", "eq", "genre")
    .groupBy("tag_slug")
    .settings(optionSettings)) satisfies DatabaseQueryFactory;

const boundsSettings = {
  max_execution_time: 30,
  max_rows_to_read: 500_000_000,
} as const;

const instagramFollowerBounds = ((database) =>
  database
    .table("new_vertical.instagram_cache")
    .max("followers", "max_followers")
    .settings(boundsSettings)) satisfies DatabaseQueryFactory;

const tiktokFollowerBounds = ((database) =>
  database
    .table("new_vertical.tiktok_cache")
    .max("follower_count", "max_followers")
    .settings(boundsSettings)) satisfies DatabaseQueryFactory;

export const createArtistFilterOptionsQueries = ((database) => ({
  countryOptions: () => countryOptions(database),
  genreOptions: () => genreOptions(database),
  instagramFollowerBounds: () => instagramFollowerBounds(database),
  tiktokFollowerBounds: () => tiktokFollowerBounds(database),
})) satisfies DatabaseQueryFactory;
