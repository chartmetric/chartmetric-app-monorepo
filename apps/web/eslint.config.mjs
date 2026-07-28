import react from "@repo/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  react,
  {
    // Compiled Lingui catalogs (gitignored; written by `lingui compile` in hooks/CI)
    ignores: ["src/locales/*/messages.js"],
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
