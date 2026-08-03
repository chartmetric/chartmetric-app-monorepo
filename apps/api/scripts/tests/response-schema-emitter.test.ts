import { describe, expect, it } from "vitest";

import { toStandaloneSchema } from "../lib/response-schema-emitter.ts";

describe("toStandaloneSchema", () => {
  it("inlines referenced component definitions", () => {
    expect(
      toStandaloneSchema({
        components: {
          schemas: {
            FilterOption: {
              properties: {
                count: { type: "number" },
                value: { type: "string" },
              },
              required: ["count", "value"],
              type: "object",
            },
          },
        },
        schema: {
          items: { $ref: "#/components/schemas/FilterOption" },
          type: "array",
        },
        version: "3.1",
      }),
    ).toEqual({
      items: {
        properties: {
          count: { type: "number" },
          value: { type: "string" },
        },
        required: ["count", "value"],
        type: "object",
      },
      type: "array",
    });
  });

  it("rejects recursive response components", () => {
    expect(() =>
      toStandaloneSchema({
        components: {
          schemas: {
            Node: {
              properties: {
                children: {
                  items: { $ref: "#/components/schemas/Node" },
                  type: "array",
                },
              },
              required: ["children"],
              type: "object",
            },
          },
        },
        schema: { $ref: "#/components/schemas/Node" },
        version: "3.1",
      }),
    ).toThrow("Recursive response schema component Node");
  });
});
