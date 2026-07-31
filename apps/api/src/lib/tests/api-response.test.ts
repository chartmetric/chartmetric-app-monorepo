import { describe, expect, expectTypeOf, it } from "vitest";

import { defineApiResponse } from "../api-response.ts";

const mapper = (id: number): { id: number } => ({ id });

describe("defineApiResponse", () => {
  it("preserves the mapper identity and signature", () => {
    const response = defineApiResponse(mapper);

    expect(response).toBe(mapper);
    expectTypeOf(response).toEqualTypeOf(mapper);
  });
});
