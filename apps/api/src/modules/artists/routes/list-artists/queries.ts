import type { DatabaseQueryFactory } from "../../../../db/clickhouse/client.ts";
import type { ListArtistsQuery } from "./schemas.ts";
import type { ListArtistsQueryFactory, MetricsDatabase } from "./types.ts";

import {
  artistMetrics,
  genreArtists,
  instagramFollowersByProfile,
  latestCmScores,
  latestInstagramSnapshots,
  latestTiktokSnapshots,
  tiktokFollowersByProfile,
  verifiedByProfile,
} from "./subqueries.ts";

const sortColumns = {
  cmScore: "cm_score",
  cmScoreChange: "cm_score_change",
  cmScoreChangePercent: "cm_score_change_percent",
  countryCode: "code2",
  instagramFollowers: "instagram_followers",
  instagramFollowersChange: "instagram_followers_change",
  instagramFollowersChangePercent: "instagram_followers_change_percent",
  name: "name",
  tiktokFollowers: "tiktok_followers",
  tiktokFollowersChange: "tiktok_followers_change",
  tiktokFollowersChangePercent: "tiktok_followers_change_percent",
} as const;

const changePeriodDays = { "1d": 1, "7d": 7, "28d": 28 } as const;

const selectArtists = ((database, query) => {
  const periodDays = changePeriodDays[query.changePeriod ?? "7d"];

  return database
    .table("new_vertical.cm_artist")
    .withCTE("latest_ig", latestInstagramSnapshots(database, periodDays))
    .withCTE("latest_tt", latestTiktokSnapshots(database, periodDays))
    .withCTE("profile_ig", instagramFollowersByProfile(database))
    .withCTE("profile_tt", tiktokFollowersByProfile(database))
    .withCTE("latest_score", latestCmScores(database, periodDays))
    .withCTE("profile_verified", verifiedByProfile(database))
    .withCTE("artist_metrics", artistMetrics(database))
    .withCTE("genre_match", genreArtists(database, query.genres ?? []))
    .withCTE("genre_exclude", genreArtists(database, query.excludeGenres ?? []))
    .final()
    .leftAnyJoin("artist_metrics", "id", "artist_metrics.artist_id")
    .leftAnyJoin("genre_match", "id", "genre_match.cm_artist")
    .leftAnyJoin("genre_exclude", "id", "genre_exclude.cm_artist")
    .select([
      "id",
      "name",
      "image_url",
      "code2",
      "record_label",
      "artist_metrics.profile_name",
      "artist_metrics.profile_image_url",
      "artist_metrics.cm_score",
      "artist_metrics.cm_score_change",
      "artist_metrics.cm_score_change_percent",
      "artist_metrics.instagram_followers",
      "artist_metrics.instagram_followers_change",
      "artist_metrics.instagram_followers_change_percent",
      "artist_metrics.tiktok_followers",
      "artist_metrics.tiktok_followers_change",
      "artist_metrics.tiktok_followers_change_percent",
      "artist_metrics.is_verified",
    ])
    .where("is_duplicate", "eq", 0)
    .where("is_non_artist", "eq", 0);
}) satisfies ListArtistsQueryFactory;

type ArtistsBuilder = ReturnType<typeof selectArtists>;

const applyArtistFilters = (
  base: ArtistsBuilder,
  query: ListArtistsQuery,
): ArtistsBuilder => {
  let builder = base;

  if (query.countries !== undefined) {
    builder = builder.where("code2", "in", query.countries);
  }
  if (query.excludeCountries !== undefined) {
    builder = builder.where("code2", "notIn", query.excludeCountries);
  }
  if (query.genres !== undefined) {
    builder = builder.whereNotNull("genre_match.cm_artist");
  }
  if (query.excludeGenres !== undefined) {
    builder = builder.whereNull("genre_exclude.cm_artist");
  }
  if (query.verifiedOnly === true) {
    builder = builder.where((predicate) =>
      predicate.fn<boolean>(
        "equals",
        predicate.col("artist_metrics.is_verified"),
        predicate.value(1),
      ),
    );
  }

  const followerBounds = [
    [
      "greaterOrEquals",
      "artist_metrics.instagram_followers",
      query.minInstagramFollowers,
    ],
    [
      "lessOrEquals",
      "artist_metrics.instagram_followers",
      query.maxInstagramFollowers,
    ],
    [
      "greaterOrEquals",
      "artist_metrics.tiktok_followers",
      query.minTiktokFollowers,
    ],
    [
      "lessOrEquals",
      "artist_metrics.tiktok_followers",
      query.maxTiktokFollowers,
    ],
  ] as const;

  for (const [operator, column, bound] of followerBounds) {
    if (bound === undefined) continue;

    builder = builder.where((predicate) =>
      predicate.fn<boolean>(
        operator,
        predicate.col(column),
        predicate.value(bound),
      ),
    );
  }

  return builder;
};

const listArtists = ((database, query) => {
  const sortBy = query.sortBy ?? "cmScore";
  const sortDirection = query.sortDirection ?? "desc";

  return applyArtistFilters(selectArtists(database, query), query)
    .orderBy(sortColumns[sortBy], sortDirection.toUpperCase() as "ASC" | "DESC")
    .orderBy("id", "ASC")
    .limit(query.limit)
    .offset(query.offset)
    .settings({
      join_use_nulls: 1,
      max_execution_time: 30,
      max_rows_to_read: 500_000_000,
    });
}) satisfies ListArtistsQueryFactory;

export const createListArtistsQueries = ((database) => {
  const metricsDatabase = database as unknown as MetricsDatabase;

  return {
    listArtists: (query: ListArtistsQuery) =>
      listArtists(metricsDatabase, query),
  };
}) satisfies DatabaseQueryFactory;

type ListArtistsQueries = ReturnType<typeof createListArtistsQueries>;
export type ArtistRow = Awaited<
  ReturnType<ReturnType<ListArtistsQueries["listArtists"]>["execute"]>
>[number];
