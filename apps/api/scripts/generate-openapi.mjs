import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { buildApp } from "../src/app.ts";

const outputPath = fileURLToPath(
  new URL("../openapi.generated.json", import.meta.url),
);

const app = await buildApp({
  clickhouse: { client: {}, db: {} },
  config: {
    clickhouseHost: "https://clickhouse.invalid",
    clickhousePassword: "",
    clickhouseUser: "",
    corsOrigins: undefined,
    host: "127.0.0.1",
    logLevel: "fatal",
    port: 8080,
  },
  openapiAudience: "complete",
});

try {
  await app.ready();
  await writeFile(outputPath, `${JSON.stringify(app.swagger(), null, 2)}\n`);
} finally {
  await app.close();
}
