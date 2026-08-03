import type {
  FastifyPluginAsyncTypebox,
  FastifyPluginCallbackTypebox,
} from "@fastify/type-provider-typebox";

export type ApiSurface = "app" | "v1";

type ApiRoutePlugin = FastifyPluginAsyncTypebox | FastifyPluginCallbackTypebox;

export interface ApiRouteRegistration {
  plugin: ApiRoutePlugin;
  surfaces: readonly ApiSurface[];
}

interface ApiRoutesOptions {
  surface: ApiSurface;
}

export const createApiRoutes = (
  registrations: readonly ApiRouteRegistration[],
): FastifyPluginAsyncTypebox<ApiRoutesOptions> =>
  async function apiRoutes(fastify, options) {
    for (const registration of registrations) {
      if (registration.surfaces.includes(options.surface)) {
        await fastify.register(registration.plugin);
      }
    }
  };
