import { describe, expect, it } from "vitest";

import { discoverMapperReplyTypes } from "../lib/response-schema-discovery.ts";

describe("discoverMapperReplyTypes", () => {
  it("discovers exported mapper return types in stable order", () => {
    const replies = discoverMapperReplyTypes(
      "example-api-to-web-mapper.ts",
      `
        const toList = () => ({ data: [] });
        const toDetail = async () => ({ id: 1 });

        export type ListReply = ReturnType<typeof toList>;
        export type DetailReply = Awaited<ReturnType<typeof toDetail>>;
        export type MapperMetadata = { version: number };
      `,
    );

    expect(replies).toEqual(["DetailReply", "ListReply"]);
  });

  it("rejects manually declared reply shapes", () => {
    expect(() =>
      discoverMapperReplyTypes(
        "example-api-to-web-mapper.ts",
        "export type DetailReply = { id: number };",
      ),
    ).toThrow(/ReturnType/);
  });

  it("requires every mapper file to expose a reply type", () => {
    expect(() =>
      discoverMapperReplyTypes(
        "example-api-to-web-mapper.ts",
        "export const toDetail = () => ({ id: 1 });",
      ),
    ).toThrow(/at least one \*Reply/);
  });
});
