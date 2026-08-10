import process from "node:process";
import { afterAll, describe, expect, it } from "vitest";

import { loadConfig } from "../../config.ts";
import { createClickhouse } from "../../db/clickhouse/client.ts";
import { toNumber } from "../../lib/numbers.ts";
import { createListActorsQueries } from "../../modules/actors/routes/list-actors/queries.ts";

const clickhouse = createClickhouse(loadConfig());

afterAll(async () => {
  await clickhouse.client.close();
});

describe("actors ClickHouse matrix", () => {
  it("records the server and approved source metadata", async () => {
    const version = await clickhouse.client.query({
      format: "JSONEachRow",
      query: "SELECT version() AS version",
    });
    const tables = await clickhouse.client.query({
      format: "JSONEachRow",
      query:
        "SELECT name, engine, sorting_key FROM system.tables WHERE database = 'new_vertical' AND name IN ('test_tv_persons', 'test_tv_person_socials', 'test_tv_credits', 'test_tv_titles') ORDER BY name",
    });
    const versionRows = await version.json<{ version: string }>();
    const tableRows = await tables.json<{
      engine: string;
      name: string;
      sorting_key: string;
    }>();

    process.stdout.write(
      `${JSON.stringify({ schema: tableRows, version: versionRows[0]?.version })}\n`,
    );
    expect(tableRows).toHaveLength(4);
  });

  it("executes bounded list and count siblings across the required matrix", async () => {
    const queries = createListActorsQueries(clickhouse.db);
    const matrix = [
      { limit: 2, offset: 0 },
      { limit: 2, offset: 2, sortDirection: "desc" as const },
      { limit: 2, offset: 0, sortDirection: "asc" as const },
    ];

    const [counts, ...pages] = await Promise.all([
      queries.countActors().execute(),
      ...matrix.map(async (query) => await queries.listActors(query).execute()),
    ]);

    expect(toNumber(counts[0]?.total)).toBeGreaterThan(0);

    const firstPage = pages[0] ?? [];

    expect(firstPage).not.toHaveLength(0);
    for (const [index, rows] of pages.entries()) {
      expect(rows.length).toBeLessThanOrEqual(matrix[index]?.limit ?? 0);
    }

    // Structural under the credit-summary inner join, so safe to assert
    // regardless of warehouse population: every returned row carries at
    // least one cast credit.
    for (const row of firstPage) {
      expect(toNumber(row.role_count)).toBeGreaterThan(0);
      expect(JSON.parse(row.known_for ?? "[]") as unknown[]).not.toHaveLength(
        0,
      );
    }

    expect(
      pages.flat().filter((row) => row.instagram_followers !== null),
    ).not.toHaveLength(0);
  });
});
