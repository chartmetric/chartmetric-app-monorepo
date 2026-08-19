import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import cors from "@fastify/cors";

import { artistsRoutes } from "../modules/artists/routes.ts";
import { athletesRoutes } from "../modules/athletes/routes.ts";
import { authRoutes } from "../modules/auth/routes.ts";
import { leaguesRoutes } from "../modules/leagues/routes.ts";

export interface AppSurfaceOptions {
  corsOrigins: string[] | undefined;
  hideFromOpenApi: boolean;
}

// Plugins registered here (e.g. session auth) stay scoped to /app/*.
export const appSurface: FastifyPluginAsyncTypebox<AppSurfaceOptions> = async (
  fastify,
  options,
) => {
  if (options.hideFromOpenApi) {
    // Public docs cover /v1 only. Contract generation also includes /app.
    fastify.addHook("onRoute", (route) => {
      route.schema = { ...route.schema, hide: true };
    });
  }

  await fastify.register(cors, { origin: options.corsOrigins ?? true });
  await fastify.register(artistsRoutes, { surface: "app" });
  await fastify.register(athletesRoutes, { surface: "app" });
  await fastify.register(authRoutes, { surface: "app" });
  await fastify.register(leaguesRoutes, { surface: "app" });
};
