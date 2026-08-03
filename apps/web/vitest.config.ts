import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    lingui(),
    babel({
      presets: [linguiTransformerBabelPreset()],
    }),
  ],
  test: {
    env: {
      VITE_API_URL: "https://api.invalid",
      VITE_PROPELAUTH_AUTH_URL: "https://auth.invalid",
    },
    environment: "jsdom",
    setupFiles: ["./src/vitest.setup.ts"],
  },
});
