import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { toAthleteFilterOptions } from "./mapper.ts";
import { createAthleteFilterOptionsQueries } from "./queries.ts";
import { AthleteFilterOptionsReplySchema } from "./schemas.ts";

export const athleteFilterOptionsRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createAthleteFilterOptionsQueries(fastify.clickhouse.db);

  fastify.get(
    "/athletes/filter-options",
    {
      schema: {
        response: {
          200: AthleteFilterOptionsReplySchema,
        },
        tags: ["athletes"],
      },
    },
    async () => {
      const rows = await queries.listAthleteFilterOptions().execute();

      return toAthleteFilterOptions(rows);
    },
  );

  done();
};
