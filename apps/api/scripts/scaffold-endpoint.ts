import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";

import type { EndpointPreflight } from "./lib/endpoint-scaffold.ts";

import {
  renderEndpointContractTest,
  validateEndpointPreflight,
} from "./lib/endpoint-scaffold.ts";
import {
  endpointSchemaCredentialsFromEnvironment,
  loadLiveEndpointSchema,
  parseIntrospectedSchema,
} from "./lib/endpoint-schema.ts";

const apiRoot = fileURLToPath(new URL("..", import.meta.url));
const schemaPath = path.join(apiRoot, "src/db/clickhouse/schema.generated.ts");
const commandArguments =
  process.argv[2] === "--" ? process.argv.slice(3) : process.argv.slice(2);
const { values } = parseArgs({
  args: commandArguments,
  options: {
    access: { type: "string" },
    columns: { multiple: true, type: "string" },
    confirm: { type: "boolean" },
    errors: { type: "string" },
    filters: { type: "string" },
    help: { short: "h", type: "boolean" },
    live: { type: "boolean" },
    method: { type: "string" },
    module: { type: "string" },
    request: { type: "string" },
    response: { type: "string" },
    route: { type: "string" },
    "route-path": { type: "string" },
    surface: { type: "string" },
    table: { multiple: true, type: "string" },
  },
});

if (values.help === true) {
  console.log(`Usage:
  pnpm --filter api create:endpoint
  pnpm --filter api create:endpoint -- --module <name> --route <name> --method <method> --route-path <path> --surface <app|v1|both> --table <name|none> --columns <csv|none> --filters <decision> --request <contract> --response <contract> --errors <behavior> --access <requirements> --confirm

Options:
  --table and --columns may be repeated as pairs for multiple data sources
  --live validates tables and columns against ClickHouse instead of the committed snapshot`);
  process.exit(0);
}

const snapshotTables = parseIntrospectedSchema(
  schemaPath,
  await readFile(schemaPath, "utf8"),
);
const loadTables = async (tableNames?: string[]) => {
  if (values.live !== true) return snapshotTables;

  const credentials = endpointSchemaCredentialsFromEnvironment();
  if (tableNames === undefined) return loadLiveEndpointSchema(credentials);

  return (
    await Promise.all(
      tableNames.map((table) =>
        loadLiveEndpointSchema({ ...credentials, table }),
      ),
    )
  ).flat();
};

const commaSeparated = (value: string): string[] =>
  value === "" || value === "none"
    ? []
    : value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

const dataFromArguments = (
  tableNames: string[],
  columnGroups: string[],
): EndpointPreflight["data"] => {
  if (tableNames.length === 0 && columnGroups.length === 0) {
    throw new Error(
      "Choose ClickHouse data with --table/--columns, or pass --table none --columns none",
    );
  }

  if (tableNames.length === 1 && tableNames[0] === "none") {
    if (columnGroups.length !== 1 || columnGroups[0] !== "none") {
      throw new Error("Use --table none together with --columns none");
    }
    return [];
  }

  if (tableNames.length !== columnGroups.length) {
    throw new Error("Pass one --columns value for every --table value");
  }

  return tableNames.map((table, index) => ({
    columns: commaSeparated(columnGroups[index] ?? ""),
    table,
  }));
};

const terminal = process.stdin.isTTY === true && process.stdout.isTTY === true;
let preflight: EndpointPreflight;
let confirmed = values.confirm === true;
const argumentData = terminal
  ? []
  : dataFromArguments(values.table ?? [], values.columns ?? []);
let tables = await loadTables(
  terminal ? undefined : argumentData.map(({ table }) => table),
);

if (terminal) {
  const prompts = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const ask = async (question: string, fallback?: string): Promise<string> => {
    const suffix = fallback === undefined ? "" : ` [${fallback}]`;
    const answer = (await prompts.question(`${question}${suffix}: `)).trim();
    return answer === "" && fallback !== undefined ? fallback : answer;
  };

  console.log(`Available tables: ${tables.map(({ name }) => name).join(", ")}`);
  const module = await ask("Module name");
  const route = await ask("Route name");
  const method = await ask("HTTP method", "GET");
  const routePath = await ask("Fastify route path");
  // Surface is the only preflight answer that cannot be corrected quietly
  // later: /v1 publishes the route to external developers. No default.
  console.log(`
Should this be a public developer API endpoint?
  app   /app only — the Chartmetric web app; hidden from /docs and openapi.json
  v1    /v1 only  — external developers with an API key; published in /docs
  both  both surfaces`);
  const surface = await ask("API surface (app, v1, both)");
  const tableNames = commaSeparated(
    await ask("ClickHouse tables, comma-separated, or none", "none"),
  );
  const dataTableNames = tableNames.includes("none") ? [] : tableNames;
  if (values.live === true && dataTableNames.length > 0) {
    tables = await loadTables(dataTableNames);
  }
  const data: EndpointPreflight["data"] = [];

  for (const table of dataTableNames) {
    const selectedTable = tables.find((candidate) => candidate.name === table);

    if (selectedTable !== undefined) {
      console.log(
        selectedTable.columns
          .map((column) => `${column.name}: ${column.type}`)
          .join("\n"),
      );
    }

    data.push({
      columns: commaSeparated(
        await ask(`Selected columns from ${table}, comma-separated`),
      ),
      table,
    });
  }
  const filters = await ask("Row filters and selection rules", "none");
  const request = await ask("Request contract");
  const response = await ask("Public response fields and shape");
  const errors = await ask("Expected error behavior");
  const access = await ask(
    "Product, permission, and API-scope requirements",
    "none",
  );

  preflight = {
    access,
    data,
    errors,
    filters,
    method,
    module,
    request,
    response,
    route,
    routePath,
    surface,
  };
  validateEndpointPreflight(preflight, tables);
  console.log(JSON.stringify(preflight, null, 2));
  confirmed = /^(?:y|yes)$/i.test(
    await ask("Create the failing contract test?", "no"),
  );
  prompts.close();
} else {
  preflight = {
    access: values.access ?? "",
    data: argumentData,
    errors: values.errors ?? "",
    filters: values.filters ?? "",
    method: values.method ?? "",
    module: values.module ?? "",
    request: values.request ?? "",
    response: values.response ?? "",
    route: values.route ?? "",
    routePath: values["route-path"] ?? "",
    surface: values.surface ?? "",
  };
  validateEndpointPreflight(preflight, tables);
  console.log(JSON.stringify(preflight, null, 2));
}

if (!confirmed) {
  throw new Error(
    "Preflight is complete but not confirmed; rerun with --confirm after user approval",
  );
}

const testDirectory = path.join(
  apiRoot,
  "src/modules",
  preflight.module,
  "tests",
);
const testPath = path.join(
  testDirectory,
  `${preflight.route}.contract.test.ts`,
);

await mkdir(testDirectory, { recursive: true });
await writeFile(testPath, renderEndpointContractTest(preflight), {
  flag: "wx",
});

console.log(`Created ${path.relative(apiRoot, testPath)}`);
console.log(`Run: pnpm --filter api test ${path.relative(apiRoot, testPath)}`);
