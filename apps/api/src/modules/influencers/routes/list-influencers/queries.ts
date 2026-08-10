import { rawAs } from "@hypequery/clickhouse";

import type { DatabaseQueryFactory } from "../../../../db/clickhouse/client.ts";
import type { ListInfluencersQuery } from "./schemas.ts";
import type {
  InfluencerDatabase,
  InfluencerQueryFactory,
  ListInfluencersQueryFactory,
} from "./types.ts";

const listSettings = {
  max_execution_time: 30,
  max_rows_to_read: 50_000_000,
} as const;

// `creator_profile_cache.profiles` is a UInt64 that keys UInt32 `profile.id`;
// the cast is the join key and must be produced inside the CTE so the join can
// reference it as a column.
const creatorProfiles = ((database) =>
  database
    .table("new_vertical.creator_profile_cache")
    .final()
    .select([
      rawAs<number | null, "profile_id">(
        "accurateCastOrNull(profiles, 'UInt32')",
        "profile_id",
      ),
      "creator_tags",
      "creator_subtags",
      "creator_country",
      "creator_city",
      "creator_gender",
      "creator_age_group",
      "tiktok_handle",
      "instagram_handle",
      "youtube_handle",
    ])) satisfies InfluencerQueryFactory;

const influencerSource = ((database) =>
  database
    .table("new_vertical.profile")
    .withCTE("creators", creatorProfiles(database))
    .final()
    .innerJoin("creators", "id", "creators.profile_id")
    .where("profile_type", "eq", "creator")
    .whereNull("deleted_at")) satisfies InfluencerQueryFactory;

type InfluencerBuilder = ReturnType<typeof influencerSource>;

const jsonCategoriesColumn = "creators.creator_tags";
const handleColumns = [
  "creators.tiktok_handle",
  "creators.instagram_handle",
  "creators.youtube_handle",
] as const;

// `creator_tags` is a JSON-encoded String, so membership is `hasAny` over the
// extracted array rather than a plain `IN`.
const whereMatchingCategories = (
  base: InfluencerBuilder,
  values: string[],
  mode: "exclude" | "include",
): InfluencerBuilder =>
  base.where((predicate) => {
    const match = predicate.fn<boolean>(
      "hasAny",
      predicate.fn(
        "JSONExtract",
        predicate.col(jsonCategoriesColumn),
        predicate.value("Array(String)"),
      ),
      predicate.array(values),
    );

    return mode === "exclude" ? predicate.fn<boolean>("not", match) : match;
  });

const whereMatchingHandle = (
  base: InfluencerBuilder,
  handle: string,
): InfluencerBuilder =>
  base.where((predicate) =>
    predicate.or(
      handleColumns.map((column) =>
        predicate.fn<boolean>(
          "notEquals",
          predicate.fn<number>(
            "positionCaseInsensitiveUTF8",
            predicate.col(column),
            predicate.value(handle),
          ),
          predicate.value(0),
        ),
      ),
    ),
  );

const applyInfluencerFilters = (
  base: InfluencerBuilder,
  query: ListInfluencersQuery,
): InfluencerBuilder => {
  let builder = base;

  if (query.categories !== undefined) {
    builder = whereMatchingCategories(builder, query.categories, "include");
  }
  if (query.excludeCategories !== undefined) {
    builder = whereMatchingCategories(
      builder,
      query.excludeCategories,
      "exclude",
    );
  }
  if (query.countries !== undefined) {
    builder = builder.where("creators.creator_country", "in", query.countries);
  }
  if (query.excludeCountries !== undefined) {
    builder = builder.where(
      "creators.creator_country",
      "notIn",
      query.excludeCountries,
    );
  }
  if (query.genders !== undefined) {
    builder = builder.where("creators.creator_gender", "in", query.genders);
  }
  if (query.excludeGenders !== undefined) {
    builder = builder.where(
      "creators.creator_gender",
      "notIn",
      query.excludeGenders,
    );
  }
  if (query.ageGroups !== undefined) {
    builder = builder.where(
      "creators.creator_age_group",
      "in",
      query.ageGroups,
    );
  }
  if (query.excludeAgeGroups !== undefined) {
    builder = builder.where(
      "creators.creator_age_group",
      "notIn",
      query.excludeAgeGroups,
    );
  }
  if (query.handle !== undefined) {
    builder = whereMatchingHandle(builder, query.handle);
  }

  return builder;
};

const selectedColumns = [
  "id",
  "name",
  "creators.creator_tags",
  "creators.creator_subtags",
  "creators.creator_country",
  "creators.creator_city",
  "creators.creator_gender",
  "creators.creator_age_group",
  "creators.tiktok_handle",
  "creators.instagram_handle",
  "creators.youtube_handle",
] as const;

const listInfluencers = ((database, query) => {
  const sortDirection = query.sortDirection ?? "asc";

  return applyInfluencerFilters(influencerSource(database), query)
    .select([...selectedColumns])
    .orderBy("name", sortDirection.toUpperCase() as "ASC" | "DESC")
    .orderBy("id", "ASC")
    .limit(query.limit)
    .offset(query.offset)
    .settings(listSettings);
}) satisfies ListInfluencersQueryFactory;

const countInfluencers = ((database, query) =>
  applyInfluencerFilters(influencerSource(database), query)
    .count("id", "total")
    .settings(listSettings)) satisfies ListInfluencersQueryFactory;

export const createListInfluencersQueries = ((database) => {
  const influencerDatabase = database as unknown as InfluencerDatabase;

  return {
    countInfluencers: (query: ListInfluencersQuery) =>
      countInfluencers(influencerDatabase, query),
    listInfluencers: (query: ListInfluencersQuery) =>
      listInfluencers(influencerDatabase, query),
  };
}) satisfies DatabaseQueryFactory;

type ListInfluencersQueries = ReturnType<typeof createListInfluencersQueries>;

export type InfluencerRow = Awaited<
  ReturnType<ReturnType<ListInfluencersQueries["listInfluencers"]>["execute"]>
>[number];

export type InfluencerCountRow = Awaited<
  ReturnType<ReturnType<ListInfluencersQueries["countInfluencers"]>["execute"]>
>[number];
