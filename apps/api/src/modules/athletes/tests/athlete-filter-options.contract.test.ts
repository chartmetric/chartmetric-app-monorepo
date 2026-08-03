import { describe, it } from "vitest";

import { endpointContractChecks } from "../../../tests/endpoint-contract.ts";

describe("GET /athletes/filter-options endpoint contract", () => {
  const checks = endpointContractChecks({
    decisions: {
      access: "App-surface authentication only; no additional route permission",
      data: [
        {
          columns: [
            "sport",
            "nationality",
            "type",
            "cm_score",
            "is_active",
            "deleted_at",
          ],
          table: "athletes_cache",
        },
      ],
      errors: "Standard server errors for ClickHouse failures",
      filters:
        "Only active, non-deleted rows; FINAL; omit empty categorical values; sort categorical options by count descending then value; calculate CM score bounds from non-null values",
      request: "No request body, path parameters, or query parameters",
      response:
        "Object with sports, nationalities, and types arrays of value/count options plus nullable cmScore min/max bounds",
    },
    method: "GET",
    routePath: "/athletes/filter-options",
    surfaces: ["app"],
  });

  it("is registered only on its declared API surfaces", checks.registration);
  it("has the expected public OpenAPI visibility", checks.publicOpenApi);
  it("has the expected complete-contract visibility", checks.completeOpenApi);
});
