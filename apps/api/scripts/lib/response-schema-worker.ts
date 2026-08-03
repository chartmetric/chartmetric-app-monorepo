import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";

export interface ResponseSchemaWorkerWorkspace {
  directory: string;
  file: string;
}

export const describeResponseSchemaWorkerFailure = (
  code: number | null,
  signal: NodeJS.Signals | null,
): string => {
  if (signal !== null) {
    return `Response schema worker exited from signal ${signal}`;
  }

  if (code === 2) {
    return [
      "Response schema generation stopped because the API source did not compile.",
      "Fix the first TypeScript error above, verify with `pnpm --filter api typecheck`, then rerun `pnpm --filter api generate:response-schemas`.",
      "Do not edit schemas.generated.ts; generated output is not the source of this failure.",
    ].join("\n");
  }

  return `Response schema worker exited with code ${String(code)}`;
};

export const createResponseSchemaWorkerWorkspace = async (
  root: string,
): Promise<ResponseSchemaWorkerWorkspace> => {
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(join(root, "run-"));

  return {
    directory,
    file: join(directory, "worker.generated.ts"),
  };
};

export const removeResponseSchemaWorkerWorkspace = async ({
  directory,
}: ResponseSchemaWorkerWorkspace): Promise<void> => {
  await rm(directory, { force: true, recursive: true });
};
