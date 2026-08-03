import { describe, it } from "vitest";

import { endpointContractChecks } from "../../../tests/endpoint-contract.ts";

describe("GET /artists endpoint contract", () => {
  const checks = endpointContractChecks({
    decisions: {
      access: "Surface authentication only; no additional route permission",
      data: [
        {
          columns: ["id", "name", "image_url", "code2", "record_label"],
          table: "cm_artist",
        },
        {
          columns: ["id", "name", "image_url", "source_id"],
          table: "profiles",
        },
      ],
      errors: "400 for invalid pagination; standard errors for failures",
      filters:
        "Exclude duplicate and non-artists; exclude deleted and inactive profiles; order by id",
      request: "Pagination query with limit and offset",
      response:
        "Paginated artists with id, name, imageUrl, countryCode, and recordLabel",
    },
    method: "GET",
    routePath: "/artists",
    surfaces: ["app", "v1"],
  });

  it("is registered only on its declared API surfaces", checks.registration);
  it("has the expected public OpenAPI visibility", checks.publicOpenApi);
  it("has the expected complete-contract visibility", checks.completeOpenApi);
});
