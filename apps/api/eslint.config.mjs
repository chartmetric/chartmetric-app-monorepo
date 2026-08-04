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
);
