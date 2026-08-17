/**
 * Compares the committed ClickHouse snapshot against the live warehouse.
 *
 * The snapshot is read as source text rather than imported: its column types
 * are string literals in a type position, so nothing survives to runtime.
 */

export type ColumnTypesByTable = ReadonlyMap<
  string,
  ReadonlyMap<string, string>
>;

export type DriftFinding =
  | {
      actual: string;
      column: string;
      expected: string;
      kind: "changed_type";
      table: string;
    }
  | { actual: string; column: string; kind: "added_column"; table: string }
  | { column: string; expected: string; kind: "missing_column"; table: string }
  | { kind: "missing_table"; table: string };

export interface LiveColumnRow {
  name: string;
  table: string;
  type: string;
}

export interface SchemaDrift {
  additions: DriftFinding[];
  breaking: DriftFinding[];
}

const SNAPSHOT_INTERFACE = "IntrospectedSchema";

const TABLE_OPENING = /^"?(\w+)"?: \{$/;
const COLUMN_ENTRY = /^"?(\w+)"?: "([^"]+)";$/;

// The two sides format nested types differently: generate-ch-schema.mjs
// collapses multi-line literals to `Tuple( a String, b String )` while
// system.columns emits `Tuple(a String, b String)`. Whitespace adjacent to
// punctuation carries no meaning, so both sides drop it before comparing.
const normalizeType = (type: string): string =>
  type
    .replaceAll(/\s+/g, " ")
    .replaceAll(/ ?([(),]) ?/g, "$1")
    .trim();

const interfaceBody = (source: string): string[] => {
  const lines = source.split("\n");
  const opening = lines.findIndex((line) =>
    line.startsWith(`export interface ${SNAPSHOT_INTERFACE} {`),
  );

  if (opening === -1) {
    throw new Error(
      `Snapshot declares no "export interface ${SNAPSHOT_INTERFACE}"`,
    );
  }

  const rest = lines.slice(opening + 1);
  const closing = rest.indexOf("}");

  if (closing === -1) {
    throw new Error(`Snapshot never closes ${SNAPSHOT_INTERFACE}`);
  }

  return rest.slice(0, closing);
};

const parseTableOpening = (text: string): string => {
  const table = TABLE_OPENING.exec(text)?.[1];

  if (table === undefined) {
    throw new Error(`Snapshot line is not a table opening: ${text}`);
  }

  return table;
};

const parseColumnEntry = (text: string): [string, string] => {
  const entry = COLUMN_ENTRY.exec(text);
  const column = entry?.[1];
  const type = entry?.[2];

  if (column === undefined || type === undefined) {
    throw new Error(`Snapshot line is not a column entry: ${text}`);
  }

  return [column, normalizeType(type)];
};

export const parseSnapshotSchema = (source: string): ColumnTypesByTable => {
  const body = interfaceBody(source);
  const tables = new Map<string, Map<string, string>>();
  let columns: Map<string, string> | undefined;

  for (const line of body) {
    const text = line.trim();

    if (text === "") {
      continue;
    }

    if (columns === undefined) {
      columns = new Map();
      tables.set(parseTableOpening(text), columns);
    } else if (text === "};") {
      columns = undefined;
    } else {
      const [column, type] = parseColumnEntry(text);
      columns.set(column, type);
    }
  }

  if (tables.size === 0) {
    throw new Error(`Snapshot ${SNAPSHOT_INTERFACE} declares no tables`);
  }

  return tables;
};

export const buildLiveSchema = (
  rows: readonly LiveColumnRow[],
): ColumnTypesByTable => {
  const tables = new Map<string, Map<string, string>>();

  for (const row of rows) {
    let columns = tables.get(row.table);
    if (columns === undefined) {
      columns = new Map();
      tables.set(row.table, columns);
    }
    columns.set(row.name, normalizeType(row.type));
  }

  return tables;
};

/**
 * Only snapshot tables are inspected — the snapshot is scoped to the tables the
 * code queries, so a warehouse table it omits is not drift.
 */
export const diffSchema = (
  snapshot: ColumnTypesByTable,
  live: ColumnTypesByTable,
): SchemaDrift => {
  const additions: DriftFinding[] = [];
  const breaking: DriftFinding[] = [];

  for (const [table, expectedColumns] of snapshot) {
    const liveColumns = live.get(table);

    if (liveColumns === undefined) {
      breaking.push({ kind: "missing_table", table });
      continue;
    }

    for (const [column, expected] of expectedColumns) {
      const actual = liveColumns.get(column);
      if (actual === undefined) {
        breaking.push({ column, expected, kind: "missing_column", table });
      } else if (actual !== expected) {
        breaking.push({
          actual,
          column,
          expected,
          kind: "changed_type",
          table,
        });
      }
    }

    for (const [column, actual] of liveColumns) {
      if (!expectedColumns.has(column)) {
        additions.push({ actual, column, kind: "added_column", table });
      }
    }
  }

  return { additions, breaking };
};

const describeFinding = (finding: DriftFinding): string => {
  switch (finding.kind) {
    case "added_column": {
      return `  ${finding.table}.${finding.column} — only in the warehouse (${finding.actual})`;
    }
    case "changed_type": {
      return `  ${finding.table}.${finding.column} — snapshot ${finding.expected}, warehouse ${finding.actual}`;
    }
    case "missing_column": {
      return `  ${finding.table}.${finding.column} — gone from the warehouse (snapshot ${finding.expected})`;
    }
    case "missing_table": {
      return `  ${finding.table} — table gone from the warehouse`;
    }
  }
};

export const formatDrift = (drift: SchemaDrift): string => {
  const lines: string[] = [];

  if (drift.breaking.length > 0) {
    lines.push(
      `Breaking drift (${String(drift.breaking.length)}):`,
      ...drift.breaking.map((finding) => describeFinding(finding)),
    );
  }

  if (drift.additions.length > 0) {
    lines.push(
      `Not in the snapshot — regenerate to pick these up (${String(drift.additions.length)}):`,
      ...drift.additions.map((finding) => describeFinding(finding)),
    );
  }

  if (lines.length === 0) {
    lines.push("Snapshot matches the warehouse.");
  }

  return lines.join("\n");
};
