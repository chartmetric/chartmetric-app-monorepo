import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { OpenApiConverter } from "@typia/utils";
import typia from "typia";

import type { ListArtistsReply } from "../src/modules/artists/artist-api-to-web-mapper.ts";

const generatedFile = fileURLToPath(
  new URL("../src/modules/artists/schemas.generated.ts", import.meta.url),
);

const schemaUnit = typia.json.schema<ListArtistsReply, "3.1">();
const components = { schemas: {} };
const responseSchema = OpenApiConverter.downgradeSchema({
  components: schemaUnit.components,
  downgraded: components,
  schema: schemaUnit.schema,
  version: "3.1",
});

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

const localizedResponseSchema = localizeReferences(responseSchema);
const localizedComponents = localizeReferences(components.schemas);
const hasComponents = Object.keys(components.schemas).length > 0;
const standaloneResponseSchema =
  typeof localizedResponseSchema === "object" &&
  localizedResponseSchema !== null &&
  !Array.isArray(localizedResponseSchema)
    ? {
        ...localizedResponseSchema,
        ...(hasComponents ? { $defs: localizedComponents } : {}),
      }
    : localizedResponseSchema;

const source = `import { Type } from "@sinclair/typebox";

import type { ListArtistsReply } from "./artist-api-to-web-mapper.ts";

export const ListArtistsReplySchema = Type.Unsafe<ListArtistsReply>(
${JSON.stringify(standaloneResponseSchema, null, 2)
  .split("\n")
  .map((line) => `  ${line}`)
  .join("\n")},
);
`;

const existingSource = await readFile(generatedFile, "utf8").catch(
  (error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  },
);

if (source !== existingSource) {
  await writeFile(generatedFile, source);
}
