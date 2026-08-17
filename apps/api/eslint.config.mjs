import node from "@repo/eslint-config/node";
import { defineConfig } from "eslint/config";
import { configs as tseslintConfigs } from "typescript-eslint";

export default defineConfig(
  node,
  // Generated schemas are regenerated, never hand-edited.
  {
    ignores: ["src/db/clickhouse/schema.generated.ts"],
  },
  // CLI entry scripts sit outside the typed-lint TS project; sync I/O,
  // process.exit, stdout reporting, and env lookups by name are their
  // normal shape.
  {
    extends: [tseslintConfigs.disableTypeChecked],
    files: ["scripts/**/*.mjs"],
    rules: {
      "n/no-process-exit": "off",
      "n/no-sync": "off",
      "no-console": "off",
      "unicorn/no-computed-property-existence-check": "off",
      "unicorn/no-process-exit": "off",
    },
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ClickHouse Nullable columns and JSON replies genuinely carry null.
      "unicorn/no-null": "off",
    },
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/db/clickhouse/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@clickhouse/client",
              message:
                "Query ClickHouse through the hypequery builder from src/db/clickhouse/client.ts. The raw client stays in src/db/clickhouse/.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: String.raw`TemplateElement[value.raw=/\bselect\b[\s\S]*\bfrom\b|\bfrom\s+[a-z_]\w*\.|\b(insert\s+into|delete\s+from|update\s+\w+\s+set)\b/i]`,
          message:
            "Hand-written SQL is not allowed. Compose queries with the hypequery builder (.table/.withCTE/.where); use rawAs only for a scalar expression.",
        },
      ],
    },
  },
);
