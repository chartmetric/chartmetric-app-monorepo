import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";

export interface ResponseSchemaWorkerWorkspace {
  directory: string;
  file: string;
}

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
