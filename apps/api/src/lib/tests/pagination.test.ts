import type { TSchema } from "@sinclair/typebox";

import { Value } from "@sinclair/typebox/value";
import { describe, expect, it } from "vitest";

import { PaginationQuerySchema } from "../pagination.ts";

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
