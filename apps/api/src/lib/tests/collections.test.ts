import { describe, expect, it } from "vitest";

import { addToGroup } from "../collections.ts";

describe("addToGroup", () => {
  it("creates the set on first use and adds to it after", () => {
    const groups = new Map<string, Set<string>>();

    addToGroup(groups, "football", "Serie A");
    addToGroup(groups, "football", "La Liga");
    addToGroup(groups, "tennis", "ATP");

    expect(groups.get("football")).toEqual(new Set(["Serie A", "La Liga"]));
    expect(groups.get("tennis")).toEqual(new Set(["ATP"]));
  });

  it("keeps a repeated value once", () => {
    const groups = new Map<string, Set<string>>();

    addToGroup(groups, "football", "Serie A");
    addToGroup(groups, "football", "Serie A");

    expect(groups.get("football")?.size).toBe(1);
  });
});
