import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  contractTestName,
  discoverEndpointContract,
  discoverRoute,
  discoverRouteRegistrations,
} from "./lib/endpoint-contracts.ts";
import {
  parseIntrospectedSchema,
  validateEndpointDataSources,
} from "./lib/endpoint-schema.ts";

const apiRoot = fileURLToPath(new URL("..", import.meta.url));
const modulesRoot = path.join(apiRoot, "src/modules");
const schemaPath = path.join(apiRoot, "src/db/clickhouse/schema.generated.ts");
const allowedSurfaces = new Set(["app", "v1"]);

const comparable = (values: string[]): string => [...values].sort().join(",");

const moduleEntries = await readdir(modulesRoot, { withFileTypes: true });
const schemaTables = parseIntrospectedSchema(
  path.relative(apiRoot, schemaPath),
  await readFile(schemaPath, "utf8"),
);
let checkedRoutes = 0;

for (const moduleEntry of moduleEntries) {
  if (!moduleEntry.isDirectory()) continue;

  const moduleRoot = path.join(modulesRoot, moduleEntry.name);
  const routesDirectory = path.join(moduleRoot, "routes");
  const routeEntries = await readdir(routesDirectory, {
    withFileTypes: true,
  }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const routeFiles = routeEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => entry.name)
    .sort();

  if (routeFiles.length === 0) continue;

  const registrarPath = path.join(moduleRoot, "routes.ts");
  const registrations = discoverRouteRegistrations(
    path.relative(apiRoot, registrarPath),
    await readFile(registrarPath, "utf8"),
  );
  const registrationsByRoute = new Map(
    registrations.map((registration) => [registration.routeStem, registration]),
  );

  if (registrationsByRoute.size !== registrations.length) {
    throw new Error(
      `${path.relative(apiRoot, registrarPath)} registers a route more than once`,
    );
  }

  for (const routeFile of routeFiles) {
    const routeStem = path.basename(routeFile, ".ts");
    const routePath = path.join(routesDirectory, routeFile);
    const relativeRoutePath = path.relative(apiRoot, routePath);
    const registration = registrationsByRoute.get(routeStem);

    if (registration === undefined) {
      throw new Error(
        `${relativeRoutePath} is not registered in ${path.relative(apiRoot, registrarPath)}`,
      );
    }

    if (
      registration.surfaces.some((surface) => !allowedSurfaces.has(surface))
    ) {
      throw new Error(`${relativeRoutePath} has an invalid API surface`);
    }

    const testPath = path.join(
      moduleRoot,
      "tests",
      contractTestName(routeFile),
    );
    const route = discoverRoute(
      relativeRoutePath,
      await readFile(routePath, "utf8"),
    );
    const contract = discoverEndpointContract(
      path.relative(apiRoot, testPath),
      await readFile(testPath, "utf8").catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") {
          throw new Error(
            `${relativeRoutePath} needs ${path.relative(apiRoot, testPath)}`,
          );
        }
        throw error;
      }),
    );

    try {
      validateEndpointDataSources(contract.decisions.data, schemaTables);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`${path.relative(apiRoot, testPath)}: ${reason}`);
    }

    if (
      contract.method !== route.method ||
      contract.routePath !== route.routePath
    ) {
      throw new Error(
        `${path.relative(apiRoot, testPath)} does not match ${relativeRoutePath}`,
      );
    }

    if (comparable(contract.surfaces) !== comparable(registration.surfaces)) {
      throw new Error(
        `${path.relative(apiRoot, testPath)} does not match the registered API surfaces`,
      );
    }

    checkedRoutes += 1;
  }

  const routeStems = new Set(
    routeFiles.map((file) => path.basename(file, ".ts")),
  );
  const extraRegistration = registrations.find(
    (registration) => !routeStems.has(registration.routeStem),
  );

  if (extraRegistration !== undefined) {
    throw new Error(
      `${path.relative(apiRoot, registrarPath)} registers missing route ${extraRegistration.routeStem}`,
    );
  }
}

console.log(`Checked ${checkedRoutes} endpoint contracts`);
