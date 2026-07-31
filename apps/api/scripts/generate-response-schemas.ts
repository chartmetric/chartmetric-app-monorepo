import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { discoverMapperReplyTypes } from "./lib/response-schema-discovery.ts";

interface MapperContract {
  file: string;
  outputFile: string;
  replies: string[];
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

const unlinkIfPresent = async (file: string): Promise<void> => {
  await unlink(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") {
      throw error;
    }
  });
};

const mapperFiles = await findFiles(modulesRoot, (name) =>
  name.endsWith("-api-to-web-mapper.ts"),
);

if (mapperFiles.length === 0) {
  throw new Error(`No *-api-to-web-mapper.ts files found under ${modulesRoot}`);
}

const contracts: MapperContract[] = await Promise.all(
  mapperFiles.map(async (file) => ({
    file,
    outputFile: join(dirname(file), "schemas.generated.ts"),
    replies: discoverMapperReplyTypes(
      relative(apiRoot, file),
      await readFile(file, "utf8"),
    ),
  })),
);

const groupedContracts = Map.groupBy(
  contracts,
  (contract) => contract.outputFile,
);

for (const [outputFile, outputContracts] of groupedContracts) {
  const duplicateReplies = outputContracts
    .flatMap((contract) => contract.replies)
    .filter((reply, index, replies) => replies.indexOf(reply) !== index);

  if (duplicateReplies.length > 0) {
    throw new Error(
      `${relative(apiRoot, outputFile)} has duplicate reply types: ${[
        ...new Set(duplicateReplies),
      ].join(", ")}`,
    );
  }
}

const temporaryDirectory = join(apiRoot, "scripts/response-schema-codegen");
await mkdir(temporaryDirectory, { recursive: true });
const workerFile = join(temporaryDirectory, "worker.generated.ts");
const emitterImport = toImportSpecifier(
  temporaryDirectory,
  join(apiRoot, "scripts/lib/response-schema-emitter.ts"),
);

let replyIndex = 0;
const workerImports: string[] = [];
const workerDefinitions = [...groupedContracts.entries()].map(
  ([outputFile, outputContracts]) => {
    const replies = outputContracts.flatMap((contract) =>
      contract.replies.map((typeName) => {
        const workerTypeName = `DiscoveredReply${replyIndex}`;
        replyIndex += 1;
        workerImports.push(
          `import type { ${typeName} as ${workerTypeName} } from ${JSON.stringify(
            toImportSpecifier(temporaryDirectory, contract.file),
          )};`,
        );

        return `      {
        mapperImport: ${JSON.stringify(
          toImportSpecifier(dirname(outputFile), contract.file),
        )},
        schemaName: ${JSON.stringify(`${typeName}Schema`)},
        schemaUnit: typia.json.schema<${workerTypeName}, "3.1">(),
        typeName: ${JSON.stringify(typeName)},
      }`;
      }),
    );

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

await writeFile(workerFile, workerSource);

const runWorker = (): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(
      "ttsx",
      ["--project", join(apiRoot, "tsconfig.codegen.json"), workerFile],
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

try {
  await runWorker();

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
  await unlinkIfPresent(workerFile);
}
