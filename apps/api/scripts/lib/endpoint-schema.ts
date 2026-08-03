import { createClient } from "@clickhouse/client";
import ts from "typescript";

export interface EndpointSchemaColumn {
  comment?: string;
  name: string;
  type: string;
}

export interface EndpointSchemaTable {
  columns: EndpointSchemaColumn[];
  name: string;
}

export interface EndpointDataSource {
  columns: readonly string[];
  table: string;
}

export const validateEndpointDataSources = (
  sources: readonly EndpointDataSource[],
  tables: readonly EndpointSchemaTable[],
): void => {
  if (new Set(sources.map(({ table }) => table)).size !== sources.length) {
    throw new Error("Selected ClickHouse tables must be unique");
  }

  for (const source of sources) {
    const table = tables.find((candidate) => candidate.name === source.table);
    if (table === undefined) {
      throw new Error(
        `Unknown table ${source.table}; inspect the live schema or regenerate the snapshot first`,
      );
    }

    if (source.columns.length === 0) {
      throw new Error(`Select at least one column from ${source.table}`);
    }

    if (new Set(source.columns).size !== source.columns.length) {
      throw new Error(`Selected columns from ${source.table} must be unique`);
    }

    const availableColumns = new Set(
      table.columns.map((column) => column.name),
    );
    const unknownColumns = source.columns.filter(
      (column) => !availableColumns.has(column),
    );

    if (unknownColumns.length > 0) {
      throw new Error(
        `Unknown columns from ${source.table}: ${unknownColumns.join(", ")}`,
      );
    }
  }
};

interface LiveEndpointSchemaOptions {
  database?: string;
  password: string;
  table?: string;
  url: string;
  username: string;
}

export const endpointSchemaCredentialsFromEnvironment = (): {
  password: string;
  url: string;
  username: string;
} => {
  const url = process.env["CLICKHOUSE_HOST"];
  const username = process.env["CLICKHOUSE_USER"];
  const password = process.env["CLICKHOUSE_PASSWORD"];

  if (url === undefined || username === undefined || password === undefined) {
    throw new Error(
      "Live inspection requires CLICKHOUSE_HOST, CLICKHOUSE_USER, and CLICKHOUSE_PASSWORD",
    );
  }

  return { password, url, username };
};

export const loadLiveEndpointSchema = async (
  options: LiveEndpointSchemaOptions,
): Promise<EndpointSchemaTable[]> => {
  const database = options.database ?? "new_vertical";
  const client = createClient({
    application: "chartmetric-endpoint-inspector",
    password: options.password,
    url: options.url,
    username: options.username,
  });

  try {
    if (options.table === undefined) {
      const result = await client.query({
        format: "JSONEachRow",
        query: `
          SELECT name
          FROM system.tables
          WHERE database = {database:String}
          ORDER BY name
          LIMIT 500
          SETTINGS
            max_execution_time = 30,
            max_rows_to_read = 1000000,
            max_result_rows = 500,
            result_overflow_mode = 'break'
        `,
        query_params: { database },
      });
      const rows = await result.json<{ name: string }>();
      return rows.map(({ name }) => ({ columns: [], name }));
    }

    const result = await client.query({
      format: "JSONEachRow",
      query: `
        SELECT name, type, comment
        FROM system.columns
        WHERE database = {database:String} AND table = {table:String}
        ORDER BY position
        LIMIT 1000
        SETTINGS
          max_execution_time = 30,
          max_rows_to_read = 1000000,
          max_result_rows = 1000,
          result_overflow_mode = 'break'
      `,
      query_params: { database, table: options.table },
    });
    const columns = await result.json<EndpointSchemaColumn>();
    return [{ columns, name: options.table }];
  } finally {
    await client.close();
  }
};

const nodeName = (node: ts.NamedDeclaration): string | null => {
  if (node.name === undefined) return null;
  return ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)
    ? node.name.text
    : null;
};

export const parseIntrospectedSchema = (
  filePath: string,
  source: string,
): EndpointSchemaTable[] => {
  const parsed = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const schema = parsed.statements.find(
    (statement): statement is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(statement) &&
      statement.name.text === "IntrospectedSchema",
  );

  if (schema === undefined) {
    throw new Error(`${filePath} does not export IntrospectedSchema`);
  }

  return schema.members.map((table) => {
    const name = nodeName(table);

    if (
      name === null ||
      !ts.isPropertySignature(table) ||
      table.type === undefined ||
      !ts.isTypeLiteralNode(table.type)
    ) {
      throw new Error(`${filePath} contains an unsupported table definition`);
    }

    const columns = table.type.members.map((column) => {
      const columnName = nodeName(column);

      if (
        columnName === null ||
        !ts.isPropertySignature(column) ||
        column.type === undefined ||
        !ts.isLiteralTypeNode(column.type) ||
        !ts.isStringLiteral(column.type.literal)
      ) {
        throw new Error(
          `${filePath} contains an unsupported column definition for ${name}`,
        );
      }

      return { name: columnName, type: column.type.literal.text };
    });

    return { columns, name };
  });
};
