import { rawAs } from "@hypequery/clickhouse";

import type { DatabaseQueryFactory } from "../../../../lib/database.ts";
import type {
  InfluencerFilterOptionsDatabase,
  InfluencerFilterOptionsQueryFactory,
} from "./types.ts";

import { ALLOWED_AGE_GROUPS } from "./schemas.ts";

const vocabularySettings = {
  max_execution_time: 30,
  max_rows_to_read: 50_000_000,
} as const;

// `creator_profile_cache.profiles` is a UInt64 that keys UInt32 `profile.id`;
// the cast is the join key and must be produced inside the CTE so the join can
// reference it as a column.
const profileIdColumn = rawAs<number | null, "profile_id">(
  "accurateCastOrNull(profiles, 'UInt32')",
  "profile_id",
);

const creatorAttributes = ((database) =>
  database
    .table("new_vertical.creator_profile_cache")
    .final()
    .select([
      profileIdColumn,
      "creator_country",
      "creator_gender",
      "creator_age_group",
    ])) satisfies InfluencerFilterOptionsQueryFactory;

// `creator_tags` is a JSON-encoded String; extracting it to `Array(String)` in
// the CTE turns per-tag counting into an `ARRAY JOIN` over a real array column.
const creatorCategories = ((database) =>
  database
    .table("new_vertical.creator_profile_cache")
    .final()
    .select([
      profileIdColumn,
      rawAs<string[], "category_tags">(
        "JSONExtract(creator_tags, 'Array(String)')",
        "category_tags",
      ),
    ])) satisfies InfluencerFilterOptionsQueryFactory;

const attributeSource = ((database) =>
  database
    .table("new_vertical.profile")
    .withCTE("creators", creatorAttributes(database))
    .final()
    .innerJoin("creators", "id", "creators.profile_id")
    .where("profile_type", "eq", "creator")
    .whereNull("deleted_at")) satisfies InfluencerFilterOptionsQueryFactory;

const countryVocabulary = ((database) =>
  attributeSource(database)
    .select(["creators.creator_country AS value"])
    .count("id", "count")
    .groupBy("creators.creator_country")
    .settings(
      vocabularySettings,
    )) satisfies InfluencerFilterOptionsQueryFactory;

const genderVocabulary = ((database) =>
  attributeSource(database)
    .select(["creators.creator_gender AS value"])
    .count("id", "count")
    .groupBy("creators.creator_gender")
    .settings(
      vocabularySettings,
    )) satisfies InfluencerFilterOptionsQueryFactory;

const ageGroupVocabulary = ((database) =>
  attributeSource(database)
    .select(["creators.creator_age_group AS value"])
    .count("id", "count")
    .where("creators.creator_age_group", "in", ALLOWED_AGE_GROUPS)
    .groupBy("creators.creator_age_group")
    .settings(
      vocabularySettings,
    )) satisfies InfluencerFilterOptionsQueryFactory;

// `ARRAY JOIN` renders before joins, and `profile` is a ReplacingMergeTree that
// must be read through a `FINAL` base — so the creator set is scoped inside the
// `scoped` CTE and the outer query only array-joins its already-extracted tags.
const scopedCreators = ((database) =>
  database
    .table("new_vertical.profile")
    .final()
    .innerJoin("creators", "id", "creators.profile_id")
    .where("profile_type", "eq", "creator")
    .whereNull("deleted_at")
    .select([
      "id AS profile_id",
      "creators.category_tags",
    ])) satisfies InfluencerFilterOptionsQueryFactory;

const categoryVocabulary = ((database) =>
  database
    .table("scoped")
    .withCTE("creators", creatorCategories(database))
    .withCTE("scoped", scopedCreators(database))
    .arrayJoin("category_tags")
    // `category_tags` is the CTE's array column; ARRAY JOIN yields one scalar
    // per row, and this cast is what tells the builder so.
    .select([rawAs<string, "value">("category_tags", "value")])
    .countDistinct("profile_id", "count")
    .groupBy("category_tags")
    .orderBy("count", "DESC")
    .settings(
      vocabularySettings,
    )) satisfies InfluencerFilterOptionsQueryFactory;

export const createInfluencerFilterOptionsQueries = ((database) => {
  const influencerDatabase =
    database as unknown as InfluencerFilterOptionsDatabase;

  return {
    ageGroupVocabulary: () => ageGroupVocabulary(influencerDatabase),
    categoryVocabulary: () => categoryVocabulary(influencerDatabase),
    countryVocabulary: () => countryVocabulary(influencerDatabase),
    genderVocabulary: () => genderVocabulary(influencerDatabase),
  };
}) satisfies DatabaseQueryFactory;

type InfluencerFilterOptionsQueries = ReturnType<
  typeof createInfluencerFilterOptionsQueries
>;

export type CategoryVocabularyRow = Awaited<
  ReturnType<
    ReturnType<InfluencerFilterOptionsQueries["categoryVocabulary"]>["execute"]
  >
>[number];

export type CountryVocabularyRow = Awaited<
  ReturnType<
    ReturnType<InfluencerFilterOptionsQueries["countryVocabulary"]>["execute"]
  >
>[number];

export type GenderVocabularyRow = Awaited<
  ReturnType<
    ReturnType<InfluencerFilterOptionsQueries["genderVocabulary"]>["execute"]
  >
>[number];

export type AgeGroupVocabularyRow = Awaited<
  ReturnType<
    ReturnType<InfluencerFilterOptionsQueries["ageGroupVocabulary"]>["execute"]
  >
>[number];
