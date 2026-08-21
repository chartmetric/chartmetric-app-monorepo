import react from "@eslint-react/eslint-plugin";
import prettier from "eslint-config-prettier";
import lingui from "eslint-plugin-lingui";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";

import base from "./base.js";

export default defineConfig(
  base,
  {
    extends: [
      react.configs["recommended-type-checked"],
      reactHooks.configs.flat.recommended,
      lingui.configs["flat/recommended"],
    ],
    files: ["**/*.{ts,tsx}"],
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
    },
  },
  {
    // User-facing strings must go through Lingui. Options follow the
    // suggested baseline from the rule docs; tests and tooling are exempt.
    files: ["**/src/**/*.{ts,tsx}", "**/components/**/*.{ts,tsx}"],
    ignores: [
      "**/*.test.{ts,tsx}",
      "**/*.test.helpers.{ts,tsx}",
      "**/vitest.setup.ts",
    ],
    rules: {
      "lingui/no-unlocalized-strings": [
        "error",
        {
          ignore: [String.raw`^(?![A-Z])\S+$`, "^[A-Z0-9_-]+$"],
          ignoreFunctions: [
            "cva",
            "cn",
            "track",
            "Error",
            "console.*",
            "*.headers.set",
            "*.addEventListener",
            "require",
          ],
          ignoreMethodsOnTypes: ["Map.get", "Map.has", "Set.has"],
          ignoreNames: [
            "className",
            "styleName",
            "rel",
            "src",
            "srcSet",
            "type",
            "id",
            "width",
            "height",
            "displayName",
            "Authorization",
            "h",
            "w",
            "mah",
            "maw",
            "mih",
            "miw",
            "bd",
          ],
          useTsTypes: true,
        },
      ],
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // React APIs (useRef(null), returning null from components) require null
      "unicorn/no-null": "off",
      // Components conventionally live in PascalCase files (Counter.tsx)
      "unicorn/filename-case": [
        "warn",
        { cases: { kebabCase: true, pascalCase: true } },
      ],
    },
  },
  {
    // Hooks conventionally live in camelCase files (useCounter.ts)
    files: ["**/use[A-Z]*.{ts,tsx}"],
    rules: {
      "unicorn/filename-case": ["warn", { cases: { camelCase: true } }],
    },
  },
  prettier,
);
