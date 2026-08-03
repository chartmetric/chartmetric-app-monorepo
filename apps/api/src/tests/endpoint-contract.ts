import type { HTTPMethods } from "fastify";

import type { ApiSurface } from "../lib/api-routes.ts";

import { buildApp } from "../app.ts";
import { stubClickhouse, testConfig } from "./helpers.ts";

const allSurfaces = ["app", "v1"] as const;

export interface EndpointContract {
  decisions: {
    access: string;
    data: readonly {
      columns: readonly string[];
      table: string;
    }[];
    errors: string;
    filters: string;
    request: string;
    response: string;
  };
  method: HTTPMethods;
  routePath: string;
  surfaces: readonly ApiSurface[];
}

const prefixedPath = (surface: ApiSurface, path: string): string =>
  `/${surface}${path}`;

const openApiPath = (surface: ApiSurface, path: string): string =>
  prefixedPath(surface, path).replaceAll(/:([^/]+)/g, "{$1}");

const hasOperation = (
  paths: Record<string, Record<string, unknown>>,
  path: string,
  method: HTTPMethods,
): boolean => paths[path]?.[method.toLowerCase()] !== undefined;

const requireMatch = (
  isActual: boolean,
  isExpected: boolean,
  subject: string,
): void => {
  if (isActual !== isExpected) {
    throw new Error(
      `${subject}: expected ${String(isExpected)}, received ${String(isActual)}`,
    );
  }
};

interface EndpointContractChecks {
  completeOpenApi: () => Promise<void>;
  publicOpenApi: () => Promise<void>;
  registration: () => Promise<void>;
}

export const endpointContractChecks = (
  contract: EndpointContract,
): EndpointContractChecks => ({
  completeOpenApi: async (): Promise<void> => {
    const app = await buildApp({
      clickhouse: stubClickhouse(),
      config: testConfig,
      openapiAudience: "complete",
    });
    await app.ready();
    const paths = app.swagger().paths as Record<
      string,
      Record<string, unknown>
    >;

    for (const surface of allSurfaces) {
      requireMatch(
        hasOperation(
          paths,
          openApiPath(surface, contract.routePath),
          contract.method,
        ),
        contract.surfaces.includes(surface),
        `${surface} complete OpenAPI operation`,
      );
    }

    await app.close();
  },
  publicOpenApi: async (): Promise<void> => {
    const app = await buildApp({
      clickhouse: stubClickhouse(),
      config: testConfig,
    });
    await app.ready();
    const paths = app.swagger().paths as Record<
      string,
      Record<string, unknown>
    >;

    requireMatch(
      hasOperation(
        paths,
        openApiPath("v1", contract.routePath),
        contract.method,
      ),
      contract.surfaces.includes("v1"),
      "v1 public OpenAPI operation",
    );
    requireMatch(
      hasOperation(
        paths,
        openApiPath("app", contract.routePath),
        contract.method,
      ),
      false,
      "app public OpenAPI operation",
    );

    await app.close();
  },
  registration: async (): Promise<void> => {
    const app = await buildApp({
      clickhouse: stubClickhouse(),
      config: testConfig,
    });
    await app.ready();

    for (const surface of allSurfaces) {
      requireMatch(
        app.hasRoute({
          method: contract.method,
          url: prefixedPath(surface, contract.routePath),
        }),
        contract.surfaces.includes(surface),
        `${surface} route registration`,
      );
    }

    await app.close();
  },
});
