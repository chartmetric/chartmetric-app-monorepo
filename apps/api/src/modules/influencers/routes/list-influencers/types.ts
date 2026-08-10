import type { createQueryBuilder } from "@hypequery/clickhouse";

import type { Database } from "../../../../db/clickhouse/schema.ts";
import type { ListInfluencersQuery } from "./schemas.ts";

type CreatorCache = Database["new_vertical.creator_profile_cache"];

// CTE aliases are query-scoped virtual tables the generator cannot introspect,
// so `withCTE` discards their shape: declaring it here is the only way the join
// helpers accept the alias. Columns carried through reference the generated
// schema so an upstream type change surfaces here; a string literal marks a
// value this query computes.
export interface InfluencerCtes {
  creators: {
    creator_age_group: CreatorCache["creator_age_group"];
    creator_city: CreatorCache["creator_city"];
    creator_country: CreatorCache["creator_country"];
    creator_gender: CreatorCache["creator_gender"];
    creator_subtags: CreatorCache["creator_subtags"];
    creator_tags: CreatorCache["creator_tags"];
    instagram_handle: CreatorCache["instagram_handle"];
    profile_id: "Nullable(UInt32)";
    tiktok_handle: CreatorCache["tiktok_handle"];
    youtube_handle: CreatorCache["youtube_handle"];
  };
}

export type InfluencerDatabase = ReturnType<
  typeof createQueryBuilder<Database & InfluencerCtes>
>;

export type InfluencerQueryFactory = (database: InfluencerDatabase) => unknown;

export type ListInfluencersQueryFactory = (
  database: InfluencerDatabase,
  query: ListInfluencersQuery,
) => unknown;
