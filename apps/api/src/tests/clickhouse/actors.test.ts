import process from "node:process";
import { afterAll, describe, expect, it } from "vitest";

import { loadConfig } from "../../config.ts";
import { createClickhouse } from "../../db/clickhouse/client.ts";
import { toNumber } from "../../lib/numbers.ts";
import { createListActorsQueries } from "../../modules/actors/routes/list-actors/queries.ts";

const clickhouse = createClickhouse(loadConfig(), {
  max_bytes_to_read: "1000000000",
  max_execution_time: 30,
  max_rows_to_read: "1000000",
  readonly: "2",
  timeout_before_checking_execution_speed: 0,
});

const EXPECTED_SOURCE_METADATA = [
  {
    engine: "SharedReplacingMergeTree",
    name: "test_tv_credits",
    sorting_key: "title_id,credit_type,person_id",
  },
  {
    engine: "SharedReplacingMergeTree",
    name: "test_tv_person_socials",
    sorting_key: "person_id,platform",
  },
  {
    engine: "SharedReplacingMergeTree",
    name: "test_tv_persons",
    sorting_key: "id",
  },
  {
    engine: "SharedReplacingMergeTree",
    name: "test_tv_titles",
    sorting_key: "kind,id",
  },
];

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
    expect(
      tableRows.map((row) => ({
        ...row,
        sorting_key: row.sorting_key.replaceAll(" ", ""),
      })),
    ).toEqual(EXPECTED_SOURCE_METADATA);
  });

  it("executes bounded list and count siblings across the required matrix", async () => {
    const queries = createListActorsQueries(clickhouse.db);
    const matrix = [
      { limit: 2, offset: 0 },
      { limit: 2, offset: 2, sortDirection: "asc" as const },
      { limit: 2, offset: 0, sortBy: "name" as const },
      { limit: 2, offset: 0, sortBy: "popularity" as const },
      { limit: 2, offset: 0, sortBy: "roleCount" as const },
    ];

    const [counts, ...pages] = await Promise.all([
      queries.countActors().execute(),
      ...matrix.map(async (query) => await queries.listActors(query).execute()),
    ]);

    expect(toNumber(counts[0]?.total)).toBeGreaterThanOrEqual(0);
    for (const [index, rows] of pages.entries()) {
      expect(rows.length).toBeLessThanOrEqual(matrix[index]?.limit ?? 0);
    }

    for (const row of pages.flat()) {
      expect(toNumber(row.role_count)).toBeGreaterThan(0);
      const knownFor = JSON.parse(row.known_for ?? "[]") as unknown[];
      expect(knownFor.length).toBeGreaterThan(0);
      expect(knownFor.length).toBeLessThanOrEqual(2);
    }

    for (const rows of pages.slice(0, 2)) {
      const firstNullIndex = rows.findIndex(
        (row) => row.instagram_followers === null,
      );
      if (firstNullIndex === -1) continue;
      expect(
        rows
          .slice(firstNullIndex)
          .every((row) => row.instagram_followers === null),
      ).toBe(true);
    }
  });
});
