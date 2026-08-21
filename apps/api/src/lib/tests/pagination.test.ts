import type { TSchema } from "@sinclair/typebox";

import { Value } from "@sinclair/typebox/value";
import { describe, expect, it } from "vitest";

import { PaginationMetaSchema, PaginationQuerySchema } from "../pagination.ts";

// Runtime values arrive untyped — widening keeps the type guard meaningful.
const isValid = (schema: TSchema, value: unknown): boolean =>
  Value.Check(schema, value);

describe("PaginationQuerySchema", () => {
  it("defaults to limit 50, offset 0", () => {
    expect(Value.Default(PaginationQuerySchema, {})).toEqual({
      limit: 50,
      offset: 0,
    });
  });

  it("rejects out-of-range values", () => {
    expect(isValid(PaginationQuerySchema, { limit: 201, offset: 0 })).toBe(
      false,
    );
    expect(isValid(PaginationQuerySchema, { limit: 0, offset: 0 })).toBe(false);
    expect(isValid(PaginationQuerySchema, { limit: 1, offset: -1 })).toBe(
      false,
    );
  });
});

describe("PaginationMetaSchema", () => {
  it("validates a reply that omits total", () => {
    expect(isValid(PaginationMetaSchema, { limit: 50, offset: 0 })).toBe(true);
  });

  it("validates a reply that supplies an integer total", () => {
    expect(
      isValid(PaginationMetaSchema, { limit: 50, offset: 0, total: 155_785 }),
    ).toBe(true);
  });

  it("rejects a non-integer total", () => {
    expect(
      isValid(PaginationMetaSchema, { limit: 50, offset: 0, total: 1.5 }),
    ).toBe(false);
  });
});
