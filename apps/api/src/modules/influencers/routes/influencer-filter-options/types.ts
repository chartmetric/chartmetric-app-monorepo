import type { createQueryBuilder } from "@hypequery/clickhouse";

import type { Database } from "../../../../db/clickhouse/schema.ts";

type CreatorCache = Database["new_vertical.creator_profile_cache"];

// CTE aliases are query-scoped virtual tables the generator cannot introspect,
// so `withCTE` discards their shape: declaring it here is the only way the join
// and array-join helpers accept the alias. `creators` is a superset carried by
// two builders that each select a subset; `scoped` is the creator set narrowed
// to `profile_type = 'creator'` before the category array join. Columns
// forwarded from the cache reference the generated schema so an upstream type
// change surfaces here; a string literal marks a value this query computes.
export interface InfluencerFilterOptionsCtes {
  creators: {
    category_tags: "Array(String)";
    creator_age_group: CreatorCache["creator_age_group"];
    creator_country: CreatorCache["creator_country"];
    creator_gender: CreatorCache["creator_gender"];
    profile_id: "Nullable(UInt32)";
  };
  scoped: {
    category_tags: "Array(String)";
    profile_id: "UInt32";
  };
}

export type InfluencerFilterOptionsDatabase = ReturnType<
  typeof createQueryBuilder<Database & InfluencerFilterOptionsCtes>
>;

export type InfluencerFilterOptionsQueryFactory = (
  database: InfluencerFilterOptionsDatabase,
) => unknown;
