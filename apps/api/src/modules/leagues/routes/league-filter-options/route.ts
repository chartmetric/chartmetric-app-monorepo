import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { toLeagueFilterOptions } from "./mapper.ts";
import { createLeagueFilterOptionsQueries } from "./queries.ts";
import { LeagueFilterOptionsReplySchema } from "./schemas.ts";

export const leagueFilterOptionsRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createLeagueFilterOptionsQueries(fastify.clickhouse.db);

  fastify.get(
    "/leagues/filter-options",
    {
      schema: {
        response: {
          200: LeagueFilterOptionsReplySchema,
        },
        tags: ["leagues"],
      },
    },
    async () =>
      toLeagueFilterOptions(await queries.listLeagueFilterOptions().execute()),
  );

  done();
};
