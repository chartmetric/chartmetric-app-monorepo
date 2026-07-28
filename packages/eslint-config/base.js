import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import barrelFiles from "eslint-plugin-barrel-files";
import importX, { createNodeResolver } from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const CONFIG_FILES = [
  "**/eslint.config.{js,mjs,cjs,ts,mts}",
  "**/*.config.{js,mjs,cjs,ts,mts}",
];

// Severity policy: "error" = can hide a real bug or runtime hazard;
// "warn" = stylistic/consistency only. Both fail CI (lint runs with
// --max-warnings 0); the tier exists so editors and humans can tell
// "fix this, it's dangerous" apart from "fix this, it's untidy".
const toWarning = (entry) => {
  if (Array.isArray(entry)) {
    return ["warn", ...entry.slice(1)];
  }
  return entry === "off" || entry === 0 ? entry : "warn";
};

const asStylistic = (configs) =>
  configs.map((config) =>
    config.rules === undefined
      ? config
      : {
          ...config,
          rules: Object.fromEntries(
            Object.entries(config.rules).map(([ruleId, entry]) => [
              ruleId,
              toWarning(entry),
            ]),
          ),
        },
  );

export default defineConfig(
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/.turbo/**",
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  asStylistic(tseslint.configs.stylisticTypeChecked),
  unicorn.configs.recommended,
  sonarjs.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    languageOptions: {
      parserOptions: {
        // Consumers must set `tsconfigRootDir: import.meta.dirname` in their
        // own eslint.config.mjs so the project service resolves the right tsconfig.
        projectService: true,
      },
    },
    plugins: { "barrel-files": barrelFiles, perfectionist },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver(),
        createNodeResolver(),
      ],
    },
  },
  {
    rules: {
      // ── correctness (error): bugs, runtime hazards, error-handling traps ──
      curly: ["error", "all"],
      "default-param-last": "off",
      eqeqeq: ["error", "always"],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-shadow": "off",
      "@typescript-eslint/default-param-last": "error",
      // property style keeps method types strictly variance-checked
      "@typescript-eslint/method-signature-style": ["error", "property"],
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unnecessary-condition": [
        "error",
        {
          allowConstantLoopConditions: "only-allowed-literals",
          checkTypePredicates: true,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowAny: false,
          allowBoolean: false,
          allowNever: false,
          allowNullish: false,
          allowNumber: false,
          allowRegExp: false,
        },
      ],
      "@typescript-eslint/return-await": ["error", "always"],
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowAny: false,
          allowNullableBoolean: false,
          allowNullableNumber: false,
          allowNullableObject: false,
          allowNullableString: false,
          allowNumber: false,
          allowString: false,
        },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        {
          considerDefaultExhaustiveForUnions: false,
          requireDefaultForNonUnion: true,
        },
      ],
      // no barrel files: packages expose code via `exports` subpaths pointing
      // at real modules, never via re-export aggregation files
      "barrel-files/avoid-barrel-files": [
        "error",
        { amountOfExportsToConsiderModuleAsBarrel: 0 },
      ],
      "barrel-files/avoid-re-export-all": "error",
      // CommonJS is opaque to tree shakers — bundled code must stay ESM
      "import-x/no-commonjs": "error",
      "import-x/no-cycle": "error",
      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            ...CONFIG_FILES,
            "**/*.test.*",
            "**/*.spec.*",
            "**/vitest.setup.*",
            "**/__tests__/**",
          ],
        },
      ],
      // cross-package imports must go through the package's `exports` map,
      // never relative paths into another workspace's source tree
      "import-x/no-relative-packages": "error",
      "import-x/no-self-import": "error",
      "import-x/no-unresolved": [
        "error",
        { ignore: [String.raw`\.css$`, "^/"] },
      ],
      "max-lines": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "error",
        { IIFEs: true, max: 80, skipBlankLines: true, skipComments: true },
      ],

      // ── stylistic/consistency (warn): conventions, ordering, naming ──
      "no-else-return": ["warn", { allowElseIf: false }],
      "object-shorthand": ["warn", "always"],
      "prefer-template": "warn",
      "sort-imports": "off",
      "@typescript-eslint/consistent-type-exports": [
        "warn",
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { fixStyle: "inline-type-imports", prefer: "type-imports" },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowHigherOrderFunctions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          format: ["camelCase"],
          leadingUnderscore: "allow",
          selector: "default",
          trailingUnderscore: "forbid",
        },
        {
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
          selector: "variable",
        },
        { format: ["camelCase", "PascalCase"], selector: "function" },
        {
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
          selector: "parameter",
        },
        { format: ["PascalCase"], selector: "typeLike" },
        { format: ["PascalCase", "UPPER_CASE"], selector: "enumMember" },
        { format: null, selector: "import" },
        { format: null, selector: "objectLiteralProperty" },
        { format: null, selector: "typeProperty" },
      ],
      "@typescript-eslint/no-import-type-side-effects": "warn",
      "@typescript-eslint/prefer-readonly": "warn",
      "import-x/first": "warn",
      "import-x/newline-after-import": "warn",
      "import-x/no-default-export": "warn",
      "import-x/no-duplicates": ["warn", { "prefer-inline": true }],
      "import-x/no-useless-path-segments": "warn",
      "import-x/order": "off",
      "perfectionist/sort-exports": ["warn", { type: "natural" }],
      "perfectionist/sort-imports": [
        "warn",
        { newlinesBetween: 1, type: "natural" },
      ],
      "perfectionist/sort-jsx-props": ["warn", { type: "natural" }],
      "perfectionist/sort-named-exports": ["warn", { type: "natural" }],
      "perfectionist/sort-named-imports": ["warn", { type: "natural" }],
      "unicorn/catch-error-name": "warn",
      "unicorn/filename-case": "warn",
      "unicorn/name-replacements": [
        "warn",
        {
          allowList: {
            args: true,
            dev: true,
            env: true,
            params: true,
            prod: true,
            props: true,
            Props: true,
            ref: true,
            Ref: true,
            refs: true,
          },
        },
      ],
      "unicorn/no-null": "warn",
      "unicorn/numeric-separators-style": "warn",
      "unicorn/prefer-switch": "warn",
      "unicorn/prefer-ternary": "warn",
      "unicorn/text-encoding-identifier-case": "warn",
    },
  },
  {
    // Tooling/config files legitimately use default exports (vite, eslint, etc.)
    files: CONFIG_FILES,
    rules: {
      "barrel-files/avoid-barrel-files": "off",
      "import-x/no-default-export": "off",
    },
  },
  {
    // Test suites and setup files are structurally one long describe()/setup
    // block — the per-function limit would just force artificial splitting.
    // The per-file limit still applies.
    files: ["**/*.test.{ts,tsx}", "**/vitest.setup.ts"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
  {
    // .cjs files are CommonJS by definition (never bundled)
    files: ["**/*.cjs"],
    rules: {
      "import-x/no-commonjs": "off",
    },
  },
  {
    // Plain JS files (eslint.config.mjs etc.) are not covered by tsconfigs,
    // and cannot carry type annotations
    extends: [tseslint.configs.disableTypeChecked],
    files: ["**/*.{js,mjs,cjs}"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
  prettier,
);
