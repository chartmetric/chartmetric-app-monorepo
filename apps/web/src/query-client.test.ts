import { describe, expect, it } from "vitest";

import { createQueryClient } from "./query-client";

describe("createQueryClient", () => {
  it("keeps query results cached across navigation", () => {
    const queries = createQueryClient().getDefaultOptions().queries;

    expect(queries?.staleTime).toBe(60 * 1000);
    expect(queries?.gcTime).toBe(30 * 60 * 1000);
    expect(queries?.refetchOnWindowFocus).toBe(false);
    expect(queries?.retry).toBe(1);
  });
});
