import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { toAthleteFilterOptions } from "../athlete-filter-options-api-to-web-mapper.ts";
import { createAthleteQueries } from "../queries.ts";
import { AthleteFilterOptionsReplySchema } from "../schemas.generated.ts";

export const athleteFilterOptionsRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createAthleteQueries(fastify.clickhouse.db);

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
