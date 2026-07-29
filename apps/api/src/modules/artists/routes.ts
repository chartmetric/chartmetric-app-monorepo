import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import { listArtistsRoute } from "./routes/list-artists.ts";

// Registrar only — each route lives in its own file under routes/.
export const artistsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  await fastify.register(listArtistsRoute);
};
