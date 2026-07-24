import react from "@eslint-react/eslint-plugin";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
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
    },
  },
  prettier,
);
