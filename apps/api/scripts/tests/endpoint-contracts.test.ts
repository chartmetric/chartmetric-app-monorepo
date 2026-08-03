import { describe, expect, it } from "vitest";

import {
  discoverEndpointContract,
  discoverRoute,
  discoverRouteRegistrations,
} from "../lib/endpoint-contracts.ts";

describe("endpoint contract discovery", () => {
  it("discovers a single Fastify route", () => {
    expect(
      discoverRoute(
        "routes/list-items.ts",
        'export const route = (fastify) => fastify.get("/items", handler);',
      ),
    ).toEqual({ method: "GET", routePath: "/items" });
  });

  it("discovers a full Fastify route declaration", () => {
    expect(
      discoverRoute(
        "routes/create-item.ts",
        `
          export const route = (fastify) => fastify.route({
            method: "POST",
            url: "/items",
            handler,
          });
        `,
      ),
    ).toEqual({ method: "POST", routePath: "/items" });
  });

  it("discovers route-level surface registrations", () => {
    expect(
      discoverRouteRegistrations(
        "routes.ts",
        `
          import { listItemsRoute } from "./routes/list-items.ts";
          export const routes = createApiRoutes([
            { plugin: listItemsRoute, surfaces: ["v1"] },
          ]);
        `,
      ),
    ).toEqual([{ routeStem: "list-items", surfaces: ["v1"] }]);
  });

  it("discovers the executable endpoint contract", () => {
    expect(
      discoverEndpointContract(
        "list-items.contract.test.ts",
        `
          const checks = endpointContractChecks({
            decisions: {
              access: "none",
              data: [{ columns: ["id", "name"], table: "items" }],
              errors: "404 when absent",
              filters: "active rows",
              request: "id path parameter",
              response: "item detail",
            },
            method: "GET",
            routePath: "/items/:id",
            surfaces: ["app", "v1"],
          });
        `,
      ),
    ).toEqual({
      decisions: {
        access: "none",
        data: [{ columns: ["id", "name"], table: "items" }],
        errors: "404 when absent",
        filters: "active rows",
        request: "id path parameter",
        response: "item detail",
      },
      method: "GET",
      routePath: "/items/:id",
      surfaces: ["app", "v1"],
    });
  });

  it("rejects route files containing multiple endpoints", () => {
    expect(() =>
      discoverRoute(
        "routes/items.ts",
        `
          fastify.get("/items", handler);
          fastify.post("/items", handler);
        `,
      ),
    ).toThrow(/exactly one/);
  });
});
