const js = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const prettier = require("eslint-config-prettier");
const globals = require("globals");
const tseslint = require("typescript-eslint");

module.exports = defineConfig(
  js.configs.recommended,
  tseslint.configs.strict,
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
);
