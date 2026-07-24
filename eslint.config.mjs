import base from "@repo/eslint-config/base";
import { defineConfig } from "eslint/config";

// Covers repo-root files and packages without their own eslint.config.mjs
// (packages/eslint-config, packages/typescript-config). Workspaces with a
// local config are matched first by ESLint's nearest-config lookup.
export default defineConfig(
  base,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // The shareable configs are themselves config files: default exports are
    // expected, `plugin.configs.*` access is the documented plugin idiom, and
    // naming-convention's schema requires `format: null` literals.
    files: ["packages/eslint-config/*.js"],
    rules: {
      "import-x/no-default-export": "off",
      "import-x/no-named-as-default": "off",
      "import-x/no-named-as-default-member": "off",
      "unicorn/no-null": "off",
    },
  },
);
