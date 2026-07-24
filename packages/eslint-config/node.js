import prettier from "eslint-config-prettier";
import n from "eslint-plugin-n";
import { defineConfig } from "eslint/config";
import globals from "globals";

import base from "./base.js";

export default defineConfig(
  base,
  n.configs["flat/recommended-module"],
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // TypeScript + import-x already resolve imports; n's resolver can't follow tsconfig
      "n/no-missing-import": "off",
      "n/no-sync": "error",
      "n/no-unsupported-features/node-builtins": [
        "error",
        { version: ">=26.0.0" },
      ],
      "n/prefer-global/buffer": ["error", "never"],
      "n/prefer-global/process": ["error", "never"],
      "n/prefer-node-protocol": "error",
      "n/prefer-promises/dns": "error",
      "n/prefer-promises/fs": "error",
    },
  },
  prettier,
);
