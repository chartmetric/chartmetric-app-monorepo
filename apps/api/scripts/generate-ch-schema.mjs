/**
 * Generates ClickHouse types for exactly the tables the codebase queries:
 * scans src/ for .table("new_vertical.<name>") calls, introspects only those
 * tables, and repairs hypequery's multi-line type literals (its generator
 * emits formatted DDL types with raw newlines, breaking the string literal).
 */

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DATABASE = "new_vertical";

const root = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = path.resolve(root, "../..");
const sourceDirectory = path.join(root, "src");
const outputPath = path.join(
  sourceDirectory,
  "db/clickhouse/schema.generated.ts",
);

/**
 * Any qualified reference counts, not just `.table()`: queries also reach tables
 * through join calls and through the CTE subquery strings the builder cannot
 * type, and all of them belong in the snapshot.
 *
 * The name must open a string literal, so a table is only picked up where it
 * could actually be sent to ClickHouse. Prose naming a table — a comment about a
 * renamed or dropped one — would otherwise be introspected as if it were a
 * dependency.
 */
const tables = new Set();
const tablePattern = new RegExp(String.raw`["'\`]${DATABASE}\.(\w+)`, "g");

// Tests name tables in assertions about generated SQL. Those tables are already
// referenced by the code under test, so reading tests can only add one that no
// query uses.
const isTest = (entry) =>
  /(?:(?:^|[/\\])tests?[/\\])|(?:\.test\.ts$)/.test(entry);

const entries = readdirSync(sourceDirectory, { recursive: true });
for (const entry of entries) {
  if (!entry.endsWith(".ts") || entry.endsWith(".generated.ts")) continue;
  if (isTest(entry)) continue;
  const content = readFileSync(path.join(sourceDirectory, entry), "utf8");
  for (const match of content.matchAll(tablePattern)) tables.add(match[1]);
}

if (tables.size === 0) {
  console.error(`No ${DATABASE}.<name> references found under src/`);
  process.exit(1);
}

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

const includeTables = [...tables]
  .toSorted((a, b) => a.localeCompare(b))
  .join(",");
console.log(`Generating types for: ${includeTables}`);

// Credentials go via env (which the CLI reads natively), not argv — argv is
// visible to every local process via `ps`.
execFileSync(
  path.join(root, "node_modules/.bin/hypequery-generate-types"),
  [
    `--database=${DATABASE}`,
    `--include-tables=${includeTables}`,
    `--output=${outputPath}`,
  ],
  {
    env: { ...process.env, CLICKHOUSE_URL: process.env.CLICKHOUSE_HOST },
    stdio: "inherit",
  },
);

const generated = readFileSync(outputPath, "utf8");

// hypequery drops a table it cannot find and still reports success, so a name
// that never reaches the snapshot has to be caught here or not at all.
const absent = [...tables]
  .toSorted((a, b) => a.localeCompare(b))
  .filter(
    (table) => !new RegExp(String.raw`^\s+${table}:`, "m").test(generated),
  );

if (absent.length > 0) {
  console.error(
    `Referenced but not found in ${DATABASE}: ${absent.join(", ")}\n` +
      "Check the spelling, or drop the reference if the table is gone.",
  );
  process.exit(1);
}

const collapseRunsWithNewlines = (literal) =>
  literal.replaceAll(/\s+/g, (run) => (run.includes("\n") ? " " : run));

const fixed = generated.replaceAll(
  /: '((?:\\.|[^'\\])*)'/gs,
  (match, literal) =>
    literal.includes("\n") ? `: '${collapseRunsWithNewlines(literal)}'` : match,
);

if (fixed !== generated) {
  writeFileSync(outputPath, fixed);
  console.log("Collapsed multi-line type literals in generated schema");
}

execFileSync(
  path.join(repoRoot, "node_modules/.bin/prettier"),
  ["--write", outputPath],
  { stdio: "inherit" },
);
