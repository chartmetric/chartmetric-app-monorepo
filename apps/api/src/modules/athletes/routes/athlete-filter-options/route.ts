import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { clubCatalogFor } from "../../club/catalog.ts";
import { toAthleteFilterOptions } from "./mapper.ts";
import { createAthleteFilterOptionsQueries } from "./queries.ts";
import { AthleteFilterOptionsReplySchema } from "./schemas.ts";

export const athleteFilterOptionsRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createAthleteFilterOptionsQueries(fastify.clickhouse.db);
  const clubCatalog = clubCatalogFor(fastify.clickhouse.db);

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
      const [rows, clubIndex] = await Promise.all([
        queries.listAthleteFilterOptions().execute(),
        clubCatalog.load(),
      ]);

      return toAthleteFilterOptions(rows, clubIndex);
    },
  );

  done();
};
