import process from "node:process";

import { buildApp } from "./app.ts";
import { loadConfig } from "./config.ts";

const config = loadConfig();
const app = await buildApp({ config });

const shutdown = (signal: NodeJS.Signals): void => {
  process.removeListener("SIGINT", shutdown);
  process.removeListener("SIGTERM", shutdown);
  app.log.info({ signal }, "shutting down");
  void app.close().catch((error: unknown) => {
    app.log.error({ err: error }, "graceful shutdown failed");
    process.exitCode = 1;
  });
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

await app.listen({ host: config.host, port: config.port });
