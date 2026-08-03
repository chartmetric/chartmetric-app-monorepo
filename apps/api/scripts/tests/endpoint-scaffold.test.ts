import { describe, expect, it } from "vitest";

import {
  renderEndpointContractTest,
  validateEndpointPreflight,
  type EndpointPreflight,
} from "../lib/endpoint-scaffold.ts";

const preflight: EndpointPreflight = {
  access: "music product; no additional permission",
  data: [{ columns: ["id", "name"], table: "cm_artist" }],
  errors: "400 for invalid pagination",
  filters: "exclude duplicate and non-artist rows",
  method: "GET",
  module: "artists",
  request: "pagination query",
  response: "id and name",
  route: "list-artists",
  routePath: "/artists",
  surface: "both",
};

const tables = [
  {
    columns: [
      { name: "id", type: "Int32" },
      { name: "name", type: "String" },
    ],
    name: "cm_artist",
  },
  {
    columns: [{ name: "id", type: "Int32" }],
    name: "profiles",
  },
];

describe("endpoint scaffold", () => {
  it("validates explicit preflight decisions", () => {
    expect(validateEndpointPreflight({ ...preflight }, tables)).toEqual(
      preflight,
    );
  });

  it("rejects columns absent from the generated schema", () => {
    expect(() =>
      validateEndpointPreflight(
        {
          ...preflight,
          data: [{ columns: ["missing"], table: "cm_artist" }],
        },
        tables,
      ),
    ).toThrow(/Unknown columns/);
  });

  it("renders a red-phase registration contract", () => {
    expect(renderEndpointContractTest(preflight)).toContain(
      'surfaces: ["app","v1"]',
    );
  });

  it("records every selected table and column group", () => {
    const multiTablePreflight: EndpointPreflight = {
      ...preflight,
      data: [...preflight.data, { columns: ["id"], table: "profiles" }],
    };

    expect(validateEndpointPreflight(multiTablePreflight, tables)).toEqual(
      multiTablePreflight,
    );
    expect(renderEndpointContractTest(multiTablePreflight)).toContain(
      '"table":"profiles"',
    );
  });
});
