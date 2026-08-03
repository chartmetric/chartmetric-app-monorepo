import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import { artistsRoutes } from "../modules/artists/routes.ts";

// Plugins registered here (e.g. api-key auth, rate limits) stay scoped to /v1/*.
export const v1Surface: FastifyPluginAsyncTypebox = async (fastify) => {
  await fastify.register(artistsRoutes, { surface: "v1" });
};
