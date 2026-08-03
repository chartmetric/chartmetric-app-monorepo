import { describe, expect, it } from "vitest";

import {
  parseIntrospectedSchema,
  validateEndpointDataSources,
} from "../lib/endpoint-schema.ts";

describe("parseIntrospectedSchema", () => {
  it("lists generated tables and columns", () => {
    expect(
      parseIntrospectedSchema(
        "schema.generated.ts",
        `
          export interface IntrospectedSchema {
            cm_artist: {
              id: "Int32";
              name: "String";
            };
          }
        `,
      ),
    ).toEqual([
      {
        columns: [
          { name: "id", type: "Int32" },
          { name: "name", type: "String" },
        ],
        name: "cm_artist",
      },
    ]);
  });

  it("validates selected tables and columns", () => {
    const tables = [
      {
        columns: [
          { name: "id", type: "UInt32" },
          { name: "name", type: "String" },
        ],
        name: "cm_artist",
      },
    ];

    expect(() =>
      validateEndpointDataSources(
        [{ columns: ["id", "name"], table: "cm_artist" }],
        tables,
      ),
    ).not.toThrow();
    expect(() =>
      validateEndpointDataSources(
        [{ columns: ["missing"], table: "cm_artist" }],
        tables,
      ),
    ).toThrow(/Unknown columns/);
  });
});
