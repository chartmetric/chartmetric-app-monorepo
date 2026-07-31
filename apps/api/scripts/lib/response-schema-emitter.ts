import { readFile, writeFile } from "node:fs/promises";

import { OpenApiConverter } from "@typia/utils";
import typia from "typia";

type SchemaUnit = ReturnType<typeof typia.json.schema<unknown, "3.1">>;

interface ReplyDefinition {
  mapperImport: string;
  responseName: string;
  schemaName: string;
  schemaUnit: SchemaUnit;
  typeName: string;
}

interface SchemaFileDefinition {
  outputFile: string;
  replies: ReplyDefinition[];
}

const componentReferencePrefix = "#/components/schemas/";
const definitionReferencePrefix = "#/$defs/";

const isNullSchema = (value: unknown): boolean =>
  typeof value === "object" &&
  value !== null &&
  "type" in value &&
  value.type === "null";

const localizeReferences = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(localizeReferences);
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      // Preserve the existing TypeBox response contract in OpenAPI.
      .filter(
        ([key, entry]) => key !== "additionalProperties" || entry !== false,
      )
      .map(([key, entry]) => {
        const normalizedEntry =
          key === "oneOf" && Array.isArray(entry)
            ? [...entry].sort(
                (left, right) =>
                  Number(isNullSchema(left)) - Number(isNullSchema(right)),
              )
            : entry;

        return [
          key === "oneOf" ? "anyOf" : key,
          key === "$ref" &&
          typeof normalizedEntry === "string" &&
          normalizedEntry.startsWith(componentReferencePrefix)
            ? `${definitionReferencePrefix}${normalizedEntry.slice(componentReferencePrefix.length)}`
            : localizeReferences(normalizedEntry),
        ];
      }),
  );
};

const toStandaloneSchema = (schemaUnit: SchemaUnit): unknown => {
  const components = { schemas: {} };
  const responseSchema = OpenApiConverter.downgradeSchema({
    components: schemaUnit.components,
    downgraded: components,
    schema: schemaUnit.schema,
    version: "3.1",
  });
  const localizedResponseSchema = localizeReferences(responseSchema);
  const localizedComponents = localizeReferences(components.schemas);
  const hasComponents = Object.keys(components.schemas).length > 0;

  return typeof localizedResponseSchema === "object" &&
    localizedResponseSchema !== null &&
    !Array.isArray(localizedResponseSchema)
    ? {
        ...localizedResponseSchema,
        ...(hasComponents ? { $defs: localizedComponents } : {}),
      }
    : localizedResponseSchema;
};

const renderSchema = (reply: ReplyDefinition): string =>
  `export const ${reply.schemaName} = Type.Unsafe<${reply.typeName}>(
${JSON.stringify(toStandaloneSchema(reply.schemaUnit), null, 2)
  .split("\n")
  .map((line) => `  ${line}`)
  .join("\n")},
);`;

const renderReplyType = (reply: ReplyDefinition): string =>
  `export type ${reply.typeName} = Awaited<ReturnType<typeof ${reply.responseName}ResponseMapper>>;`;

const writeIfChanged = async (file: string, source: string): Promise<void> => {
  const existingSource = await readFile(file, "utf8").catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return undefined;
      }

      throw error;
    },
  );

  if (source !== existingSource) {
    await writeFile(file, source);
  }
};

export const writeResponseSchemaFiles = async (
  definitions: SchemaFileDefinition[],
): Promise<void> => {
  await Promise.all(
    definitions.map(async ({ outputFile, replies }) => {
      const imports = Map.groupBy(
        replies,
        (reply) => reply.mapperImport,
      ).entries();
      const typeImports = [...imports]
        .map(
          ([mapperImport, importedReplies]) =>
            `import type { ${importedReplies
              .map(
                (reply) =>
                  `${reply.responseName} as ${reply.responseName}ResponseMapper`,
              )
              .join(", ")} } from ${JSON.stringify(mapperImport)};`,
        )
        .join("\n");
      const schemas = replies
        .map((reply) => `${renderReplyType(reply)}\n\n${renderSchema(reply)}`)
        .join("\n\n");
      const source = `import { Type } from "@sinclair/typebox";

${typeImports}

${schemas}
`;

      await writeIfChanged(outputFile, source);
    }),
  );
};
