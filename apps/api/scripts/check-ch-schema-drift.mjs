/**
 * Fails when the committed ClickHouse snapshot no longer matches the live
 * warehouse: an upstream rename or column-type change otherwise passes every
 * unit test and surfaces as a 500 at request time.
 */

import { createClient } from "@clickhouse/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildLiveSchema,
  diffSchema,
  formatDrift,
  parseSnapshotSchema,
} from "../src/db/clickhouse/schema-drift.ts";

const DATABASE = "new_vertical";

const root = fileURLToPath(new URL("..", import.meta.url));
const snapshotPath = path.join(root, "src/db/clickhouse/schema.generated.ts");

const missing = [
  "CLICKHOUSE_HOST",
  "CLICKHOUSE_USER",
  "CLICKHOUSE_PASSWORD",
].filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(
    `Missing environment variables: ${missing.join(", ")} — see .env.example`,
  );
  process.exit(1);
}

const snapshot = parseSnapshotSchema(readFileSync(snapshotPath, "utf8"));
const tables = snapshot
  .keys()
  .toArray()
  .toSorted((a, b) => a.localeCompare(b));

console.log(
  `Checking ${tables.length} tables in ${DATABASE} against the snapshot`,
);

const client = createClient({
  application: "chartmetric-app-api-schema-drift",
  password: process.env.CLICKHOUSE_PASSWORD,
  url: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER,
});

let rows;
try {
  const result = await client.query({
    format: "JSONEachRow",
    query: `
      SELECT table, name, type
      FROM system.columns
      WHERE database = {db:String} AND table IN ({tables:Array(String)})
    `,
    query_params: { db: DATABASE, tables },
  });
  rows = await result.json();
} catch (error) {
  console.error(
    `Could not read system.columns from ${DATABASE}: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
} finally {
  await client.close();
}

if (rows === undefined) {
  process.exit(1);
}

const drift = diffSchema(snapshot, buildLiveSchema(rows));
const report = formatDrift(drift);

if (drift.breaking.length > 0) {
  console.error(report);
  console.error(
    "\nRun `pnpm --filter api generate:ch-schema` and fix the queries the change breaks.",
  );
  process.exit(1);
}

console.log(report);
