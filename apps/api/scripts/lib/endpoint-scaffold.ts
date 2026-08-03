import type {
  EndpointDataSource,
  EndpointSchemaTable,
} from "./endpoint-schema.ts";

import { validateEndpointDataSources } from "./endpoint-schema.ts";

export const apiSurfaces = ["app", "v1", "both"] as const;
export const httpMethods = [
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
] as const;

export interface EndpointPreflight {
  access: string;
  data: EndpointDataSource[];
  errors: string;
  filters: string;
  method: string;
  module: string;
  request: string;
  response: string;
  route: string;
  routePath: string;
  surface: string;
}

const identifierPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const validateEndpointPreflight = (
  preflight: EndpointPreflight,
  tables: EndpointSchemaTable[],
): EndpointPreflight => {
  if (!identifierPattern.test(preflight.module)) {
    throw new Error("Module must be lowercase kebab-case");
  }

  if (!identifierPattern.test(preflight.route)) {
    throw new Error("Route name must be lowercase kebab-case");
  }

  preflight.method = preflight.method.toUpperCase();
  if (!httpMethods.includes(preflight.method as (typeof httpMethods)[number])) {
    throw new Error(`Method must be one of ${httpMethods.join(", ")}`);
  }

  if (
    !apiSurfaces.includes(preflight.surface as (typeof apiSurfaces)[number])
  ) {
    throw new Error(`Surface must be one of ${apiSurfaces.join(", ")}`);
  }

  if (!preflight.routePath.startsWith("/")) {
    throw new Error("Route path must start with /");
  }

  const decisions: Record<string, string> = {
    access: preflight.access,
    errors: preflight.errors,
    filters: preflight.filters,
    request: preflight.request,
    response: preflight.response,
  };

  for (const [name, value] of Object.entries(decisions)) {
    if (value.trim() === "") throw new Error(`${name} decision is required`);
  }

  validateEndpointDataSources(preflight.data, tables);

  return preflight;
};

export const endpointSurfaces = (surface: string): string[] =>
  surface === "both" ? ["app", "v1"] : [surface];

export const renderEndpointContractTest = (
  preflight: EndpointPreflight,
): string => `import { describe, it } from "vitest";

import { endpointContractChecks } from "../../../tests/endpoint-contract.ts";

describe(${JSON.stringify(`${preflight.method} ${preflight.routePath} endpoint contract`)}, () => {
  const checks = endpointContractChecks({
    decisions: {
      access: ${JSON.stringify(preflight.access)},
      data: ${JSON.stringify(preflight.data)},
      errors: ${JSON.stringify(preflight.errors)},
      filters: ${JSON.stringify(preflight.filters)},
      request: ${JSON.stringify(preflight.request)},
      response: ${JSON.stringify(preflight.response)},
    },
    method: ${JSON.stringify(preflight.method)},
    routePath: ${JSON.stringify(preflight.routePath)},
    surfaces: ${JSON.stringify(endpointSurfaces(preflight.surface))},
  });

  it("is registered only on its declared API surfaces", checks.registration);
  it("has the expected public OpenAPI visibility", checks.publicOpenApi);
  it("has the expected complete-contract visibility", checks.completeOpenApi);
});
`;
