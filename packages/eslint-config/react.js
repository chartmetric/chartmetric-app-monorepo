import react from "@eslint-react/eslint-plugin";
import prettier from "eslint-config-prettier";
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
    ],
    files: ["**/*.{ts,tsx}"],
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
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
  prettier,
);
