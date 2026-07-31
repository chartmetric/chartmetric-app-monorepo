import { spawn } from "node:child_process";
import { readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { discoverApiResponseContracts } from "./lib/response-schema-discovery.ts";
import {
  createResponseSchemaWorkerWorkspace,
  removeResponseSchemaWorkerWorkspace,
} from "./lib/response-schema-worker.ts";

interface ResponseContract {
  file: string;
  outputFile: string;
  responseName: string;
}

const apiRoot = fileURLToPath(new URL("..", import.meta.url));
const modulesRoot = join(apiRoot, "src/modules");

const findFiles = async (
  directory: string,
  predicate: (name: string) => boolean,
): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (entry) => {
        const path = join(directory, entry.name);

        if (entry.isDirectory()) {
          return findFiles(path, predicate);
        }

        return predicate(entry.name) ? [path] : [];
      }),
  );

  return files.flat();
};

const toImportSpecifier = (fromDirectory: string, toFile: string): string => {
  const path = relative(fromDirectory, toFile).split(sep).join("/");
  return path.startsWith(".") ? path : `./${path}`;
};

const sourceFiles = await findFiles(
  modulesRoot,
  (name) =>
    name.endsWith(".ts") &&
    !name.endsWith(".d.ts") &&
    !name.endsWith(".generated.ts") &&
    !name.endsWith(".spec.ts") &&
    !name.endsWith(".test.ts"),
);

const contracts: ResponseContract[] = (
  await Promise.all(
    sourceFiles.map(async (file) =>
      discoverApiResponseContracts(
        relative(apiRoot, file),
        await readFile(file, "utf8"),
      ).map(({ name }) => ({
        file,
        outputFile: join(dirname(file), "schemas.generated.ts"),
        responseName: name,
      })),
    ),
  )
).flat();

if (contracts.length === 0) {
  throw new Error(`No defineApiResponse markers found under ${modulesRoot}`);
}

const groupedContracts = Map.groupBy(
  contracts,
  (contract) => contract.outputFile,
);

for (const [outputFile, outputContracts] of groupedContracts) {
  const responseNames = outputContracts.map(
    (contract) => contract.responseName,
  );
  const duplicateResponses = responseNames.filter(
    (responseName, index) => responseNames.indexOf(responseName) !== index,
  );

  if (duplicateResponses.length > 0) {
    throw new Error(
      `${relative(apiRoot, outputFile)} has duplicate API responses: ${[
        ...new Set(duplicateResponses),
      ].join(", ")}`,
    );
  }
}

const workerRoot = join(apiRoot, "scripts/response-schema-codegen");
const workerWorkspace = await createResponseSchemaWorkerWorkspace(workerRoot);

try {
  const emitterImport = toImportSpecifier(
    workerWorkspace.directory,
    join(apiRoot, "scripts/lib/response-schema-emitter.ts"),
  );
  let replyIndex = 0;
  const workerImports: string[] = [];
  const workerDefinitions = [...groupedContracts.entries()].map(
    ([outputFile, outputContracts]) => {
      const replies = outputContracts.map((contract) => {
        const workerTypeName = `DiscoveredResponse${replyIndex}`;
        const typeName = `${contract.responseName}Reply`;
        replyIndex += 1;
        workerImports.push(
          `import type { ${contract.responseName} as ${workerTypeName} } from ${JSON.stringify(
            toImportSpecifier(workerWorkspace.directory, contract.file),
          )};`,
        );

        return `      {
        mapperImport: ${JSON.stringify(
          toImportSpecifier(dirname(outputFile), contract.file),
        )},
        responseName: ${JSON.stringify(contract.responseName)},
        schemaName: ${JSON.stringify(`${typeName}Schema`)},
        schemaUnit: typia.json.schema<Awaited<ReturnType<typeof ${workerTypeName}>>, "3.1">(),
        typeName: ${JSON.stringify(typeName)},
      }`;
      });

      return `  {
    outputFile: ${JSON.stringify(outputFile)},
    replies: [
${replies.join(",\n")}
    ],
  }`;
    },
  );

  const workerSource = `import typia from "typia";

import { writeResponseSchemaFiles } from ${JSON.stringify(emitterImport)};
${workerImports.join("\n")}

await writeResponseSchemaFiles([
${workerDefinitions.join(",\n")}
]);
`;

  await writeFile(workerWorkspace.file, workerSource);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      "ttsx",
      [
        "--project",
        join(apiRoot, "tsconfig.codegen.json"),
        workerWorkspace.file,
      ],
      {
        cwd: apiRoot,
        stdio: "inherit",
      },
    );

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          signal === null
            ? `Response schema worker exited with code ${String(code)}`
            : `Response schema worker exited from signal ${signal}`,
        ),
      );
    });
  });

  const expectedOutputs = new Set(groupedContracts.keys());
  const existingOutputs = await findFiles(
    modulesRoot,
    (name) => name === "schemas.generated.ts",
  );

  await Promise.all(
    existingOutputs
      .filter((file) => !expectedOutputs.has(file))
      .map((file) => unlink(file)),
  );
} finally {
  await removeResponseSchemaWorkerWorkspace(workerWorkspace);
}
