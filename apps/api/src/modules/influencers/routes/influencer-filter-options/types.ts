import type { createQueryBuilder } from "@hypequery/clickhouse";

import type { Database } from "../../../../db/clickhouse/schema.ts";

type CreatorCache = Database["new_vertical.creator_profile_cache"];

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
