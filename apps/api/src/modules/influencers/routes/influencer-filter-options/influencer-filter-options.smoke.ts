import { afterAll, describe, expect, it } from "vitest";

import type { ClickHouse } from "../../../../db/clickhouse/client.ts";

import {
  createSmokeClickhouse,
  executeSmokeQuery,
} from "../../../../db/clickhouse/clickhouse-smoke.ts";
import { createInfluencerFilterOptionsQueries } from "./queries.ts";
import { ALLOWED_AGE_GROUPS } from "./schemas.ts";

const smoke: ClickHouse = createSmokeClickhouse();
const queries = createInfluencerFilterOptionsQueries(smoke.db);

const assertOptionShape = (
  rows: { count: unknown; value: unknown }[],
): void => {
  for (const row of rows) {
    expect(typeof row.value).toBe("string");
    expect(Number.isNaN(Number(row.count))).toBe(false);
  }
};

describe("influencer filter-options vocabularies against real ClickHouse", () => {
  afterAll(async () => {
    await smoke.client.close();
  });

  it.each([
    "categoryVocabulary",
    "countryVocabulary",
    "genderVocabulary",
    "ageGroupVocabulary",
  ] as const)(
    "accepts the %s query and returns the option row shape",
    async (name) => {
      const rows = await executeSmokeQuery(name, queries[name]());

      expect(rows.length).toBeGreaterThan(0);
      assertOptionShape(rows);
    },
  );

  it("returns only supported age-group buckets", async () => {
    const rows = await executeSmokeQuery(
      "ageGroupVocabulary values",
      queries.ageGroupVocabulary(),
    );

    const allowed: readonly string[] = ALLOWED_AGE_GROUPS;
    for (const row of rows) {
      expect(allowed).toContain(row.value);
    }
  });
});
