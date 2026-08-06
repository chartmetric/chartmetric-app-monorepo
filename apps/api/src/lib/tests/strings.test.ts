import { describe, expect, it } from "vitest";

import { emptyToNull } from "../strings.ts";

describe("emptyToNull", () => {
  it("keeps a non-empty string", () => {
    expect(emptyToNull("Label A")).toBe("Label A");
  });

  it("collapses the warehouse's empty-string and absent cases to null", () => {
    expect(emptyToNull("")).toBeNull();
    expect(emptyToNull(null)).toBeNull();
    expect(emptyToNull(undefined)).toBeNull();
  });
});
