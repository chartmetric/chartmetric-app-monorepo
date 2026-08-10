import { describe, expect, it } from "vitest";

import {
  executeSmokeQuery,
  resolveSmokeCredentials,
} from "../clickhouse-smoke.ts";

const credentials = {
  CLICKHOUSE_HOST: "https://clickhouse.invalid:8443",
  CLICKHOUSE_PASSWORD: "secret",
  CLICKHOUSE_USER: "reader",
};

describe("resolveSmokeCredentials", () => {
  it("returns the resolved credentials when all variables are present", () => {
    expect(resolveSmokeCredentials(credentials)).toEqual({
      host: "https://clickhouse.invalid:8443",
      password: "secret",
      user: "reader",
    });
  });

  it("throws naming every missing variable", () => {
    expect(() => resolveSmokeCredentials({})).toThrow(
      /CLICKHOUSE_HOST, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD/,
    );
  });

  it("names only the variable that is missing", () => {
    expect(() =>
      resolveSmokeCredentials({
        ...credentials,
        CLICKHOUSE_PASSWORD: undefined,
      }),
    ).toThrow(/missing CLICKHOUSE_PASSWORD\b/);
  });

  it("treats an empty string as missing", () => {
    expect(() =>
      resolveSmokeCredentials({ ...credentials, CLICKHOUSE_USER: "" }),
    ).toThrow(/missing CLICKHOUSE_USER\b/);
  });
});

describe("executeSmokeQuery", () => {
  it("returns the rows a query resolves", async () => {
    const rows = [{ profile_id: 1 }];

    await expect(
      executeSmokeQuery("resolves", {
        execute: async () => {
          await Promise.resolve();
          return rows;
        },
      }),
    ).resolves.toBe(rows);
  });

  it("propagates a ClickHouse server error instead of swallowing it", async () => {
    const serverError = new Error(
      "Code: 47. DB::Exception: Unknown identifier: deleted_at",
    );

    const rejection = executeSmokeQuery("ambiguous-identifier", {
      execute: async () => {
        await Promise.resolve();
        throw serverError;
      },
    });

    await expect(rejection).rejects.toThrow(/ambiguous-identifier/);
    await expect(rejection).rejects.toHaveProperty("cause", serverError);
  });
});
