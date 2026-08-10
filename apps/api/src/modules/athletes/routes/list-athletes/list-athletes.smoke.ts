import { afterAll, describe, expect, it } from "vitest";

import type { ClickHouse } from "../../../../db/clickhouse/client.ts";
import type { ListAthletesQuery } from "./schemas.ts";

import {
  createSmokeClickhouse,
  executeSmokeQuery,
} from "../../../../db/clickhouse/clickhouse-smoke.ts";
import { type AthleteRow, createListAthletesQueries } from "./queries.ts";

const base: ListAthletesQuery = { limit: 25, offset: 0 };

const filterCases: [label: string, query: ListAthletesQuery][] = [
  ["name", { ...base, name: "a" }],
  ["sports", { ...base, sports: ["Tennis"] }],
  ["nationalities", { ...base, nationalities: ["United States"] }],
  ["types", { ...base, types: ["athlete"] }],
  ["excludeSports", { ...base, excludeSports: ["Tennis"] }],
  ["excludeNationalities", { ...base, excludeNationalities: ["Canada"] }],
  ["excludeTypes", { ...base, excludeTypes: ["team"] }],
  ["minCmScore", { ...base, minCmScore: 0 }],
  ["maxCmScore", { ...base, maxCmScore: 100 }],
];

const sortColumns: NonNullable<ListAthletesQuery["sortBy"]>[] = [
  "cmScore",
  "name",
  "nationality",
  "sport",
  "type",
];

const sortCases: [label: string, query: ListAthletesQuery][] =
  sortColumns.flatMap((sortBy) =>
    (["asc", "desc"] as const).map(
      (sortDirection): [string, ListAthletesQuery] => [
        `${sortBy} ${sortDirection}`,
        { ...base, sortBy, sortDirection },
      ],
    ),
  );

const expectStringOrNull = (value: unknown): void => {
  expect(value === null || typeof value === "string").toBe(true);
};

const expectNumberOrNull = (value: unknown): void => {
  expect(value === null || typeof value === "number").toBe(true);
};

const assertAthleteShape = (rows: AthleteRow[]): void => {
  for (const row of rows) {
    expect(typeof row.profile_id).toBe("number");
    expect(typeof row.name).toBe("string");
    expect(typeof row.sport).toBe("string");
    expect(typeof row.type).toBe("string");
    expectStringOrNull(row.image_url);
    expectStringOrNull(row.nationality);
    expectNumberOrNull(row.cm_score);
  }
};

const smoke: ClickHouse = createSmokeClickhouse();
const queries = createListAthletesQueries(smoke.db);

describe("list-athletes query against real ClickHouse", () => {
  afterAll(async () => {
    await smoke.client.close();
  });

  it("accepts the unfiltered default and returns the athlete row shape", async () => {
    const rows = await executeSmokeQuery("default", queries.listAthletes(base));

    expect(rows.length).toBeGreaterThan(0);
    assertAthleteShape(rows);
  });

  it.each(filterCases)("accepts the %s filter", async (label, query) => {
    assertAthleteShape(
      await executeSmokeQuery(label, queries.listAthletes(query)),
    );
  });

  it.each(sortCases)("accepts sorting by %s", async (label, query) => {
    assertAthleteShape(
      await executeSmokeQuery(label, queries.listAthletes(query)),
    );
  });
});
