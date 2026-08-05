import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { toArtistFilterOptions } from "./mapper.ts";
import { createArtistFilterOptionsQueries } from "./queries.ts";
import { ArtistFilterOptionsReplySchema } from "./schemas.ts";

export const artistFilterOptionsRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createArtistFilterOptionsQueries(fastify.clickhouse.db);

  fastify.get(
    "/artists/filter-options",
    {
      schema: {
        response: {
          200: ArtistFilterOptionsReplySchema,
        },
        tags: ["artists"],
      },
    },
    async () => {
      const [countryRows, genreRows, instagramBoundsRows, tiktokBoundsRows] =
        await Promise.all([
          queries.countryOptions().execute(),
          queries.genreOptions().execute(),
          queries.instagramFollowerBounds().execute(),
          queries.tiktokFollowerBounds().execute(),
        ]);

      return toArtistFilterOptions(
        countryRows,
        genreRows,
        instagramBoundsRows,
        tiktokBoundsRows,
      );
    },
  );

  done();
};
