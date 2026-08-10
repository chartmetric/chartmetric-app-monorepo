import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { toInfluencerList } from "./mapper.ts";
import { createListInfluencersQueries } from "./queries.ts";
import {
  ListInfluencersQuerySchema,
  ListInfluencersReplySchema,
} from "./schemas.ts";

export const listInfluencersRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createListInfluencersQueries(fastify.clickhouse.db);

  fastify.get(
    "/influencers",
    {
      schema: {
        querystring: ListInfluencersQuerySchema,
        response: {
          200: ListInfluencersReplySchema,
        },
        tags: ["influencers"],
      },
    },
    async (request) => {
      const [influencers, counts] = await Promise.all([
        queries.listInfluencers(request.query).execute(),
        queries.countInfluencers(request.query).execute(),
      ]);

      const total = Number(counts[0]?.total ?? 0);

      return toInfluencerList(influencers, request.query, total);
    },
  );

  done();
};
