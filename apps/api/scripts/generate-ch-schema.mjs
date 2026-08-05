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
const repositoryRoot = path.resolve(root, "../..");
const sourceDir = path.join(root, "src");
const outputPath = path.join(sourceDir, "db/clickhouse/schema.generated.ts");

// Any qualified reference counts, not just `.table()`: queries also reach
// tables through join calls and through the CTE subquery strings that the
// builder cannot type, and all of them belong in the snapshot.
const tables = new Set();
const tablePattern = new RegExp(String.raw`\b${DATABASE}\.(\w+)`, "g");

for (const entry of readdirSync(sourceDir, { recursive: true })) {
  if (!entry.endsWith(".ts") || entry.endsWith(".generated.ts")) continue;
  const content = readFileSync(path.join(sourceDir, entry), "utf8");
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

const includeTables = [...tables].sort().join(",");
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
const fixed = generated.replaceAll(
  /: '((?:\\.|[^'\\])*)'/gs,
  (match, literal) =>
    literal.includes("\n")
      ? `: '${literal.replaceAll(/\s*\n\s*/g, " ")}'`
      : match,
);

if (fixed !== generated) {
  writeFileSync(outputPath, fixed);
  console.log("Collapsed multi-line type literals in generated schema");
}

execFileSync(
  path.join(repositoryRoot, "node_modules/.bin/prettier"),
  ["--write", outputPath],
  { stdio: "inherit" },
);
