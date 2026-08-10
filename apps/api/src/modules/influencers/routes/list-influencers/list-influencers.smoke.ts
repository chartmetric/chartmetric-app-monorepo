import { afterAll, describe, expect, it } from "vitest";

import type { ClickHouse } from "../../../../db/clickhouse/client.ts";
import type { ListInfluencersQuery } from "./schemas.ts";

import {
  createSmokeClickhouse,
  executeSmokeQuery,
} from "../../../../db/clickhouse/clickhouse-smoke.ts";
import { createListInfluencersQueries, type InfluencerRow } from "./queries.ts";

const base: ListInfluencersQuery = { limit: 25, offset: 0 };

const filterCases: [label: string, query: ListInfluencersQuery][] = [
  ["categories", { ...base, categories: ["Music"] }],
  ["excludeCategories", { ...base, excludeCategories: ["Music"] }],
  ["countries", { ...base, countries: ["US"] }],
  ["excludeCountries", { ...base, excludeCountries: ["US"] }],
  ["genders", { ...base, genders: ["female"] }],
  ["excludeGenders", { ...base, excludeGenders: ["male"] }],
  ["ageGroups", { ...base, ageGroups: ["25-34"] }],
  ["excludeAgeGroups", { ...base, excludeAgeGroups: ["65+"] }],
  ["handle", { ...base, handle: "a" }],
];

const sortCases: [label: string, query: ListInfluencersQuery][] = (
  ["asc", "desc"] as const
).map((sortDirection): [string, ListInfluencersQuery] => [
  `name ${sortDirection}`,
  { ...base, sortDirection },
]);

const expectString = (value: unknown): void => {
  expect(typeof value).toBe("string");
};

const assertInfluencerShape = (rows: InfluencerRow[]): void => {
  for (const row of rows) {
    expect(typeof row.id).toBe("number");
    expectString(row.name);
    expectString(row.creator_tags);
    expectString(row.creator_subtags);
    expectString(row.creator_country);
    expectString(row.creator_city);
    expectString(row.creator_gender);
    expectString(row.creator_age_group);
    expectString(row.tiktok_handle);
    expectString(row.instagram_handle);
    expectString(row.youtube_handle);
  }
};

const smoke: ClickHouse = createSmokeClickhouse();
const queries = createListInfluencersQueries(smoke.db);

describe("list-influencers query against real ClickHouse", () => {
  afterAll(async () => {
    await smoke.client.close();
  });

  it("accepts the unfiltered default and returns the influencer row shape", async () => {
    const rows = await executeSmokeQuery(
      "default",
      queries.listInfluencers(base),
    );

    expect(rows.length).toBeGreaterThan(0);
    assertInfluencerShape(rows);
  });

  it.each(filterCases)("accepts the %s filter", async (label, query) => {
    assertInfluencerShape(
      await executeSmokeQuery(label, queries.listInfluencers(query)),
    );
  });

  it.each(sortCases)("accepts sorting by %s", async (label, query) => {
    assertInfluencerShape(
      await executeSmokeQuery(label, queries.listInfluencers(query)),
    );
  });

  it("counts the filtered set alongside the list", async () => {
    const query: ListInfluencersQuery = { ...base, countries: ["US"] };

    const [rows, counts] = await Promise.all([
      executeSmokeQuery("list pair", queries.listInfluencers(query)),
      executeSmokeQuery("count pair", queries.countInfluencers(query)),
    ]);

    assertInfluencerShape(rows);
    const total = Number(counts[0]?.total ?? 0);
    expect(total).toBeGreaterThanOrEqual(rows.length);
  });

  it("returns rows carrying empty-value string columns", async () => {
    const rows = await executeSmokeQuery(
      "empty values",
      queries.listInfluencers({ ...base, limit: 200 }),
    );

    assertInfluencerShape(rows);
    expect(
      rows.some(
        (row) =>
          row.creator_city === "" ||
          row.creator_country === "" ||
          row.creator_age_group === "",
      ),
    ).toBe(true);
  });
});
