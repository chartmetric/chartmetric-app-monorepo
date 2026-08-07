import node from "@repo/eslint-config/node";
import { defineConfig } from "eslint/config";

export default defineConfig(
  node,
  // Generated schemas are regenerated, never hand-edited.
  // scripts/ holds codegen utilities outside the typed-lint TS project.
  {
    ignores: ["src/db/clickhouse/schema.generated.ts", "scripts/"],
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
