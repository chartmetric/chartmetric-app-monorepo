import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { toNumber } from "../../../../lib/numbers.ts";
import { toActorList } from "./mapper.ts";
import { createListActorsQueries } from "./queries.ts";
import { ListActorsQuerySchema, ListActorsReplySchema } from "./schemas.ts";

export const listActorsRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createListActorsQueries(fastify.clickhouse.db);

  fastify.get(
    "/actors",
    {
      schema: {
        querystring: ListActorsQuerySchema,
        response: { 200: ListActorsReplySchema },
        tags: ["actors"],
      },
    },
    async (request) => {
      const [actors, countRows] = await Promise.all([
        queries.listActors(request.query).execute(),
        queries.countActors().execute(),
      ]);

      return toActorList(
        actors,
        toNumber(countRows[0]?.total ?? null) ?? 0,
        request.query,
      );
    },
  );

  done();
};
