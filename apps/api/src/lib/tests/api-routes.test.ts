import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";

import Fastify from "fastify";
import { describe, expect, it } from "vitest";

import { createApiRoutes } from "../api-routes.ts";

const route: FastifyPluginCallbackTypebox = (fastify, _options, done) => {
  fastify.get("/example", () => ({ ok: true }));
  done();
};

describe("createApiRoutes", () => {
  it("registers a route only on its declared surfaces", async () => {
    const app = Fastify();
    const routes = createApiRoutes([{ plugin: route, surfaces: ["v1"] }]);

    await app.register(routes, { prefix: "/app", surface: "app" });
    await app.register(routes, { prefix: "/v1", surface: "v1" });
    await app.ready();

    expect(app.hasRoute({ method: "GET", url: "/app/example" })).toBe(false);
    expect(app.hasRoute({ method: "GET", url: "/v1/example" })).toBe(true);
    await app.close();
  });
});
