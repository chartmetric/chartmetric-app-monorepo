import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import type { EndpointSchemaTable } from "./lib/endpoint-schema.ts";

import {
  endpointSchemaCredentialsFromEnvironment,
  loadLiveEndpointSchema,
  parseIntrospectedSchema,
} from "./lib/endpoint-schema.ts";

const DATABASE = "new_vertical";
const schemaPath = fileURLToPath(
  new URL("../src/db/clickhouse/schema.generated.ts", import.meta.url),
);

const commandArguments =
  process.argv[2] === "--" ? process.argv.slice(3) : process.argv.slice(2);
const { values } = parseArgs({
  args: commandArguments,
  options: {
    live: { type: "boolean" },
    table: { type: "string" },
  },
});

const printRows = (headers: string[], rows: string[][]): void => {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );
  const render = (row: string[]): string =>
    row.map((value, index) => value.padEnd(widths[index] ?? 0)).join("  ");

  console.log(render(headers));
  console.log(render(widths.map((width) => "-".repeat(width))));
  for (const row of rows) console.log(render(row));
};

const snapshotTables = async (): Promise<EndpointSchemaTable[]> =>
  parseIntrospectedSchema(schemaPath, await readFile(schemaPath, "utf8"));

const tables =
  values.live === true
    ? await loadLiveEndpointSchema({
        ...endpointSchemaCredentialsFromEnvironment(),
        database: DATABASE,
        ...(values.table === undefined ? {} : { table: values.table }),
      })
    : await snapshotTables();

if (values.table === undefined) {
  printRows(
    ["Table", "Columns"],
    tables.map((table) => [
      table.name,
      table.columns.length === 0
        ? "live: use --table"
        : String(table.columns.length),
    ]),
  );
} else {
  const table = tables.find((candidate) => candidate.name === values.table);

  if (table === undefined || table.columns.length === 0) {
    throw new Error(`Table ${values.table} was not found in ${DATABASE}`);
  }

  printRows(
    ["Column", "ClickHouse type", "Comment"],
    table.columns.map((column) => [
      column.name,
      column.type,
      column.comment === undefined || column.comment === ""
        ? "-"
        : column.comment,
    ]),
  );
}
