import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createResponseSchemaWorkerWorkspace,
  removeResponseSchemaWorkerWorkspace,
} from "../lib/response-schema-worker.ts";

describe("response schema worker workspace", () => {
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
