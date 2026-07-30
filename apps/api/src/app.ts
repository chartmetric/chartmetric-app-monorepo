import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

import sensible from "@fastify/sensible";
import Fastify, { type FastifyInstance } from "fastify";

import type { Config } from "./config.ts";
import type { ClickHouse } from "./db/clickhouse/client.ts";

import { authServicePlugin } from "./plugins/auth-service.ts";
import { clickhousePlugin } from "./plugins/clickhouse.ts";
import { openapiPlugin } from "./plugins/openapi.ts";
import { appSurface } from "./routes/app-surface.ts";
import { healthRoutes } from "./routes/health.ts";
import { v1Surface } from "./routes/v1-surface.ts";

export interface BuildAppOptions {
  clickhouse?: ClickHouse;
  config: Config;
  openapiAudience?: "complete" | "public";
}

export const buildApp = async (
  options: BuildAppOptions,
): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: { level: options.config.logLevel },
  }).withTypeProvider<TypeBoxTypeProvider>();

  await app.register(sensible);
  await app.register(openapiPlugin);
  await app.register(authServicePlugin, { config: options.config });

  if (options.clickhouse === undefined) {
    await app.register(clickhousePlugin, { config: options.config });
  } else {
    app.decorate("clickhouse", options.clickhouse);
  }

  await app.register(healthRoutes);
  await app.register(appSurface, {
    corsOrigins: options.config.corsOrigins,
    hideFromOpenApi: options.openapiAudience !== "complete",
    prefix: "/app",
  });
  await app.register(v1Surface, { prefix: "/v1" });

  return app;
};
