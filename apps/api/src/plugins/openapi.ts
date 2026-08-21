import type { FastifyPluginCallback } from "fastify";

import swagger from "@fastify/swagger";
import scalarImport from "@scalar/fastify-api-reference";
import fp from "fastify-plugin";

// @scalar/fastify-api-reference ships d.ts files with extensionless relative
// ESM imports, which NodeNext resolution cannot follow — its export type
// collapses to `any`. Re-type the plugin minimally until upstream fixes it.
const scalarApiReference = scalarImport as FastifyPluginCallback<{
  routePrefix: `/${string}`;
}>;

export const openapiPlugin = fp(
  async (fastify) => {
    await fastify.register(swagger, {
      openapi: {
        info: {
          description: "Chartmetric app + developer API",
          title: "Chartmetric API",
          version: "0.1.0",
        },
        openapi: "3.1.0",
        tags: [
          { description: "Artist catalog", name: "artists" },
          { description: "Athlete catalog", name: "athletes" },
          { description: "League catalog", name: "leagues" },
          { description: "Service health", name: "system" },
        ],
      },
    });

    await fastify.register(scalarApiReference, { routePrefix: "/docs" });

    fastify.get("/openapi.json", { schema: { hide: true } }, () =>
      fastify.swagger(),
    );
  },
  { name: "openapi" },
);
