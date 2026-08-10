import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "src/tests/clickhouse/**/*.test.ts"],
    include: ["src/**/*.test.ts"],
  },
});
