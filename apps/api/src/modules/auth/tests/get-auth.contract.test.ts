import { describe, it } from "vitest";

import { endpointContractChecks } from "../../../tests/endpoint-contract.ts";

describe("GET /auth endpoint contract", () => {
  const checks = endpointContractChecks({
    decisions: {
      access:
        "App-surface session authentication only; the bearer token and optional org header identify the caller",
      data: [],
      errors:
        "401 without a usable token; 403 without an org membership; 502 when AuthService is unreachable",
      filters: "none",
      request: "Optional authorization and x-org-id headers",
      response:
        "Access context with the resolved user, account, and enabled products",
    },
    method: "GET",
    routePath: "/auth",
    surfaces: ["app"],
  });

  it("is registered only on its declared API surfaces", checks.registration);
  it("has the expected public OpenAPI visibility", checks.publicOpenApi);
  it("has the expected complete-contract visibility", checks.completeOpenApi);
});
