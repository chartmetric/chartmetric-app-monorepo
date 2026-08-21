import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { toNumber } from "../../../../lib/numbers.ts";
import { toLeagueList } from "./mapper.ts";
import { createListLeaguesQueries } from "./queries.ts";
import { ListLeaguesQuerySchema, ListLeaguesReplySchema } from "./schemas.ts";

export const listLeaguesRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createListLeaguesQueries(fastify.clickhouse.db);

  fastify.get(
    "/leagues",
    {
      schema: {
        querystring: ListLeaguesQuerySchema,
        response: {
          200: ListLeaguesReplySchema,
        },
        tags: ["leagues"],
      },
    },
    async (request) => {
      const { query } = request;
      const [rows, totals] = await Promise.all([
        queries.listLeagues(query).execute(),
        queries.countLeagues(query).execute(),
      ]);

      return toLeagueList(rows, query, toNumber(totals[0]?.total ?? 0) ?? 0);
    },
  );

  done();
};
