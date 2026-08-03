import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createResponseSchemaWorkerWorkspace,
  describeResponseSchemaWorkerFailure,
  removeResponseSchemaWorkerWorkspace,
} from "../lib/response-schema-worker.ts";

describe("response schema worker workspace", () => {
  it("provides recovery steps when imported API source does not compile", () => {
    const message = describeResponseSchemaWorkerFailure(2, null);

    expect(message).toContain("API source did not compile");
    expect(message).toContain("pnpm --filter api typecheck");
    expect(message).toContain("pnpm --filter api generate:response-schemas");
    expect(message).toContain("Do not edit schemas.generated.ts");
  });

  it("isolates concurrent workers and cleans them independently", async () => {
    const root = await mkdtemp(join(tmpdir(), "response-schema-worker-test-"));

    try {
      const [first, second] = await Promise.all([
        createResponseSchemaWorkerWorkspace(root),
        createResponseSchemaWorkerWorkspace(root),
      ]);

      expect(first.directory).not.toBe(second.directory);
      expect(first.file).not.toBe(second.file);

      await Promise.all([
        writeFile(first.file, "first"),
        writeFile(second.file, "second"),
      ]);
      await removeResponseSchemaWorkerWorkspace(first);

      await expect(access(first.file)).rejects.toMatchObject({
        code: "ENOENT",
      });
      await expect(readFile(second.file, "utf8")).resolves.toBe("second");

      await removeResponseSchemaWorkerWorkspace(second);
      await expect(access(second.file)).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
