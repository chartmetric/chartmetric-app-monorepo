import react from "@repo/eslint-config/react";
import { defineConfig } from "eslint/config";
import globals from "globals";
import { configs as tseslintConfigs } from "typescript-eslint";

export default defineConfig(
  react,
  {
    // Compiled Lingui catalogs (gitignored; written by `lingui compile` in hooks/CI)
    ignores: ["src/locales/*/*/messages.js"],
  },
  // CLI entry scripts sit outside the typed-lint TS project; process access,
  // exits, and stdout reporting are their normal shape, and dev tooling may
  // import devDependencies.
  {
    extends: [tseslintConfigs.disableTypeChecked],
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
    rules: {
      "import-x/no-extraneous-dependencies": "off",
      "n/no-process-exit": "off",
      "no-console": "off",
      "unicorn/no-process-exit": "off",
    },
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
