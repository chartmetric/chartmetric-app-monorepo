import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const modulesRoot = fileURLToPath(new URL("../modules", import.meta.url));

const readEndpointFolders = async (moduleRoot: string): Promise<string[]> => {
  try {
    const routeEntries = await readdir(path.join(moduleRoot, "routes"), {
      withFileTypes: true,
    });

    return routeEntries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
};

describe("module route registration", () => {
  it("registers every endpoint folder in its module registrar", async () => {
    const moduleEntries = await readdir(modulesRoot, { withFileTypes: true });

    for (const moduleEntry of moduleEntries) {
      if (!moduleEntry.isDirectory()) continue;

      const moduleRoot = path.join(modulesRoot, moduleEntry.name);
      const endpoints = await readEndpointFolders(moduleRoot);

      if (endpoints.length === 0) continue;

      const registrar = await readFile(
        path.join(moduleRoot, "routes.ts"),
        "utf8",
      );

      for (const endpoint of endpoints) {
        expect(
          registrar,
          `${moduleEntry.name}/routes.ts must register ./routes/${endpoint}/route.ts`,
        ).toContain(`./routes/${endpoint}/route.ts`);
      }
    }
  });
});
