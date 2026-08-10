import { afterAll, describe, expect, it } from "vitest";

import type { ClickHouse } from "../../../../db/clickhouse/client.ts";
import type { ListAthletesQuery } from "./schemas.ts";

import {
  createSmokeClickhouse,
  executeSmokeQuery,
} from "../../../../db/clickhouse/clickhouse-smoke.ts";
import { type AthleteListRow, createListAthletesQueries } from "./queries.ts";

const base: ListAthletesQuery = { limit: 25, offset: 0 };

const filterCases: [label: string, query: ListAthletesQuery][] = [
  ["name", { ...base, name: "a" }],
  ["sports", { ...base, sports: ["Tennis"] }],
  ["nationalities", { ...base, nationalities: ["United States"] }],
  ["clubs", { ...base, clubs: ["Arsenal"] }],
  ["leagues", { ...base, leagues: ["NBA"] }],
  ["levels", { ...base, levels: ["professional"] }],
  ["excludeSports", { ...base, excludeSports: ["Tennis"] }],
  ["excludeNationalities", { ...base, excludeNationalities: ["Canada"] }],
  ["minCmScore", { ...base, minCmScore: 0 }],
  ["maxCmScore", { ...base, maxCmScore: 100 }],
  ["minFollowers", { ...base, minFollowers: 0 }],
  ["maxFollowers", { ...base, maxFollowers: 1_000_000_000 }],
  ["verified", { ...base, verified: true }],
];

const sortColumns: NonNullable<ListAthletesQuery["sortBy"]>[] = [
  "cmScore",
  "igFollowers",
  "igPosts",
  "name",
  "nationality",
  "rank",
  "sport",
  "tiktokFollowers",
  "tiktokLikes",
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

// An Int64 column arrives as a string over JSON, so either is in shape here;
// `toNumber` is what narrows it, and its own unit tests cover that.
const expectWarehouseNumber = (value: unknown): void => {
  expect(
    value === null || typeof value === "number" || typeof value === "string",
  ).toBe(true);
};

const assertAthleteShape = (rows: AthleteListRow[]): void => {
  for (const row of rows) {
    expect(typeof row.profile_id).toBe("number");
    expectStringOrNull(row.name);
    expectStringOrNull(row.sport);
    expectStringOrNull(row.nationality);
    expectStringOrNull(row.image_url);
    expectStringOrNull(row.ig_handle);
    expectNumberOrNull(row.cm_score);
    expectWarehouseNumber(row.ig_followers);
    expectWarehouseNumber(row.tiktok_followers);
    expectWarehouseNumber(row.athlete_rank);
  }
};

const smoke: ClickHouse = createSmokeClickhouse();
const queries = createListAthletesQueries(smoke.db);

describe("list-athletes query against real ClickHouse", () => {
  afterAll(async () => {
    await smoke.client.close();
  });

  it("accepts the unfiltered default and returns the athlete row shape", async () => {
    assertAthleteShape(
      await executeSmokeQuery("default", queries.listAthletes(base)),
    );
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

  it("counts the filtered set alongside the list", async () => {
    const query: ListAthletesQuery = { ...base, sports: ["Tennis"] };

    const [rows, counts] = await Promise.all([
      executeSmokeQuery("list pair", queries.listAthletes(query)),
      executeSmokeQuery("count pair", queries.countAthletes(query)),
    ]);

    assertAthleteShape(rows);
    expect(Number(counts[0]?.total ?? 0)).toBeGreaterThanOrEqual(rows.length);
  });
});
