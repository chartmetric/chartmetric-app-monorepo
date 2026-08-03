import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { toAthleteList } from "../athlete-api-to-web-mapper.ts";
import { ListAthletesQuerySchema } from "../list-athletes-query.ts";
import { createAthleteQueries } from "../queries.ts";
import { ListAthletesReplySchema } from "../schemas.generated.ts";

export const listAthletesRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createAthleteQueries(fastify.clickhouse.db);

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
