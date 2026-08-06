import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import { toNumber } from "../../../../lib/numbers.ts";
import { clubCatalogFor } from "../../club/catalog.ts";
import { clubsForLeagues } from "../../club/club-utilities.ts";
import { toAthleteList } from "./mapper.ts";
import { createListAthletesQueries } from "./queries.ts";
import { ListAthletesQuerySchema, ListAthletesReplySchema } from "./schemas.ts";
import { findInvertedRange } from "./validation.ts";

export const listAthletesRoute: FastifyPluginCallbackTypebox = (
  fastify,
  _options,
  done,
) => {
  const queries = createListAthletesQueries(fastify.clickhouse.db);
  const clubCatalog = clubCatalogFor(fastify.clickhouse.db);

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
      const { query } = request;
      const invertedRange = findInvertedRange(query);

      if (invertedRange !== undefined) {
        throw fastify.httpErrors.badRequest(invertedRange);
      }

      const clubIndex = await clubCatalog.load();
      const options =
        query.leagues === undefined
          ? {}
          : { leagueClubNames: clubsForLeagues(clubIndex, query.leagues) };
      const [rows, totals] = await Promise.all([
        queries.listAthletes(query, options).execute(),
        queries.countAthletes(query, options).execute(),
      ]);

      return toAthleteList(rows, query, toNumber(totals[0]?.total ?? 0) ?? 0, {
        clubIndex,
        today: new Date(),
      });
    },
  );

  done();
};
