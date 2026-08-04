import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { PaginationQuerySchema } from "../../../../lib/pagination.ts";
import { toArtistList } from "./mapper.ts";
import { createListArtistsQueries } from "./queries.ts";
import { ListArtistsReplySchema } from "./schemas.ts";

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
        querystring: PaginationQuerySchema,
        response: {
          200: ListArtistsReplySchema,
        },
        tags: ["artists"],
      },
    },
    async (request) => {
      const artists = await queries.listArtists(request.query).execute();
      const profiles =
        artists.length > 0
          ? await queries
              .profilesBySourceIds(artists.map((artist) => artist.id))
              .execute()
          : [];

      return toArtistList(artists, profiles, request.query);
    },
  );

  done();
};
