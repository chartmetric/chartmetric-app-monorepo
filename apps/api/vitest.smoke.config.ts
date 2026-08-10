import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Queries run against real ClickHouse with max_execution_time: 30, so the
    // 5s default would fail a slow-but-accepted query exactly like a rejected
    // one — erasing the distinction this suite exists to draw.
    hookTimeout: 60_000,
    include: ["src/**/*.smoke.ts"],
    testTimeout: 60_000,
  },
});
