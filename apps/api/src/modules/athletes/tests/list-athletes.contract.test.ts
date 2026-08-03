import { describe, it } from "vitest";

import { endpointContractChecks } from "../../../tests/endpoint-contract.ts";

describe("GET /athletes endpoint contract", () => {
  const checks = endpointContractChecks({
    decisions: {
      access:
        "App-surface session authentication and v1 developer API-key authentication; no additional route permission",
      data: [
        {
          columns: [
            "profile_id",
            "name",
            "image_url",
            "sport",
            "nationality",
            "type",
            "cm_score",
          ],
          table: "athletes_cache",
        },
      ],
      errors: "400 for invalid pagination; standard errors for failures",
      filters:
        "Only active, non-deleted rows; FINAL; optional name, include/exclude sport, nationality, and type lists, and CM score range filters; sortable visible columns; default CM score descending",
      request:
        "Pagination, name, categorical include/exclude arrays, CM score range, sort column, and sort direction query parameters",
      response:
        "Paginated athletes with id, name, imageUrl, sport, nationality, type, and cmScore",
    },
    method: "GET",
    routePath: "/athletes",
    surfaces: ["app", "v1"],
  });

  it("is registered only on its declared API surfaces", checks.registration);
  it("has the expected public OpenAPI visibility", checks.publicOpenApi);
  it("has the expected complete-contract visibility", checks.completeOpenApi);
});
