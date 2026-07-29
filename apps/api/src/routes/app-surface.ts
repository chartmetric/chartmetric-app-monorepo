import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import cors from "@fastify/cors";

import { artistsRoutes } from "../modules/artists/routes.ts";

export interface AppSurfaceOptions {
  corsOrigins: string[] | undefined;
}

// Plugins registered here (e.g. session auth) stay scoped to /app/*.
export const appSurface: FastifyPluginAsyncTypebox<AppSurfaceOptions> = async (
  fastify,
  options,
) => {
  await fastify.register(cors, { origin: options.corsOrigins ?? true });
  await fastify.register(artistsRoutes);
};
