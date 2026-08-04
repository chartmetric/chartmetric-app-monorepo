import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { toAthleteList } from "./mapper.ts";
import { createListAthletesQueries } from "./queries.ts";
import { ListAthletesQuerySchema, ListAthletesReplySchema } from "./schemas.ts";

export const listAthletesRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createListAthletesQueries(fastify.clickhouse.db);

  fastify.get(
    "/athletes",
    {
      schema: {
        querystring: ListAthletesQuerySchema,
        response: {
          200: ListAthletesReplySchema,
        },
        tags: ["athletes"],
      },
    },
    async (request) => {
      if (
        request.query.minCmScore !== undefined &&
        request.query.maxCmScore !== undefined &&
        request.query.minCmScore > request.query.maxCmScore
      ) {
        throw fastify.httpErrors.badRequest(
          "minCmScore must be less than or equal to maxCmScore",
        );
      }

      const athletes = await queries.listAthletes(request.query).execute();

      return toAthleteList(athletes, request.query);
    },
  );

  done();
};
