import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { toInfluencerFilterOptions } from "./mapper.ts";
import { createInfluencerFilterOptionsQueries } from "./queries.ts";
import { InfluencerFilterOptionsReplySchema } from "./schemas.ts";

export const influencerFilterOptionsRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createInfluencerFilterOptionsQueries(fastify.clickhouse.db);

  fastify.get(
    "/influencers/filter-options",
    {
      schema: {
        response: {
          200: InfluencerFilterOptionsReplySchema,
        },
        tags: ["influencers"],
      },
    },
    async () => {
      const [categoryRows, countryRows, genderRows, ageGroupRows] =
        await Promise.all([
          queries.categoryVocabulary().execute(),
          queries.countryVocabulary().execute(),
          queries.genderVocabulary().execute(),
          queries.ageGroupVocabulary().execute(),
        ]);

      return toInfluencerFilterOptions(
        categoryRows,
        countryRows,
        genderRows,
        ageGroupRows,
      );
    },
  );

  done();
};
