import { describe, expect, it, vi } from "vitest";

import type { ClickHouseDatabase } from "../../../db/clickhouse/client.ts";

import { clubCatalogFor, createClubCatalog } from "./catalog.ts";

const TTL_MS = 5 * 60 * 1000;

/**
 * Counts how many times the catalog reaches the warehouse. The catalog queries
 * only chain these builder methods before `execute`, so a stub of them stands in
 * for the whole builder.
 */
const CHAINED = ["final", "groupBy", "limit", "select", "settings", "where"];

const countingDatabase = (
  shouldFail: (attempt: number) => boolean = () => false,
): { database: ClickHouseDatabase; loads: () => number } => {
  let executions = 0;
  const chain: Record<string, unknown> = {
    execute: async () => {
      await Promise.resolve();
      executions += 1;

      if (shouldFail(executions)) throw new Error("warehouse unavailable");

      return [];
    },
  };

  for (const method of CHAINED) chain[method] = () => chain;

  return {
    // Four queries per load, so divide to report loads rather than queries.
    database: { table: () => chain } as unknown as ClickHouseDatabase,
    loads: () => executions / 4,
  };
};

describe("createClubCatalog", () => {
  it("reads the warehouse once and serves later calls from the cache", async () => {
    const { database, loads } = countingDatabase();
    const catalog = createClubCatalog(database, () => 0);

    await catalog.load();
    await catalog.load();
    await catalog.load();

    expect(loads()).toBe(1);
  });

  it("reloads once the entry is older than the TTL", async () => {
    const { database, loads } = countingDatabase();
    const now = vi.fn(() => 0);
    const catalog = createClubCatalog(database, now);

    await catalog.load();
    now.mockReturnValue(TTL_MS - 1);
    await catalog.load();

    expect(loads()).toBe(1);

    now.mockReturnValue(TTL_MS);
    await catalog.load();

    expect(loads()).toBe(2);
  });

  // Concurrent first requests would otherwise each issue the same four queries.
  it("shares one load between callers that arrive together", async () => {
    const { database, loads } = countingDatabase();
    const catalog = createClubCatalog(database, () => 0);

    await Promise.all([catalog.load(), catalog.load(), catalog.load()]);

    expect(loads()).toBe(1);
  });

  it("does not cache a failed load", async () => {
    // The four queries of the first load fail; everything after succeeds.
    const { database } = countingDatabase((attempt) => attempt <= 4);
    const catalog = createClubCatalog(database, () => 0);

    await expect(catalog.load()).rejects.toThrow("warehouse unavailable");

    // The next caller retries rather than inheriting the rejected promise.
    await expect(catalog.load()).resolves.toBeDefined();
  });
});

describe("clubCatalogFor", () => {
  it("gives every route the same catalog for one database", () => {
    const { database } = countingDatabase();

    expect(clubCatalogFor(database)).toBe(clubCatalogFor(database));
  });

  it("keeps separate databases apart", () => {
    expect(clubCatalogFor(countingDatabase().database)).not.toBe(
      clubCatalogFor(countingDatabase().database),
    );
  });
});
