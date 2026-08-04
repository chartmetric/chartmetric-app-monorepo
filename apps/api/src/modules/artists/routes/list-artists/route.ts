import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { toArtistList } from "./mapper.ts";
import { createListArtistsQueries } from "./queries.ts";
import { ListArtistsQuerySchema, ListArtistsReplySchema } from "./schemas.ts";

export const listArtistsRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createListArtistsQueries(fastify.clickhouse.db);

  fastify.get(
    "/artists",
    {
      schema: {
        querystring: ListArtistsQuerySchema,
        response: {
          200: ListArtistsReplySchema,
        },
        tags: ["artists"],
      },
    },
    async (request) => {
      const artists = await queries.listArtists(request.query).execute();

      return toArtistList(artists, request.query);
    },
  );

  done();
};
