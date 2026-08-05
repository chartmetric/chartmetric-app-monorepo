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
      const followerRanges = [
        [
          request.query.minInstagramFollowers,
          request.query.maxInstagramFollowers,
          "minInstagramFollowers must be less than or equal to maxInstagramFollowers",
        ],
        [
          request.query.minTiktokFollowers,
          request.query.maxTiktokFollowers,
          "minTiktokFollowers must be less than or equal to maxTiktokFollowers",
        ],
      ] as const;

      for (const [min, max, message] of followerRanges) {
        if (min !== undefined && max !== undefined && min > max) {
          throw fastify.httpErrors.badRequest(message);
        }
      }

      const artists = await queries.listArtists(request.query).execute();

      return toArtistList(artists, request.query);
    },
  );

  done();
};
