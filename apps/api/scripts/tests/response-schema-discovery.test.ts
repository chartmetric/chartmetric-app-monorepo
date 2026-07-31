import { describe, expect, it } from "vitest";

import { discoverApiResponseContracts } from "../lib/response-schema-discovery.ts";

describe("discoverApiResponseContracts", () => {
  it("discovers markers independently of filenames and reply suffixes", () => {
    const contracts = discoverApiResponseContracts(
      "anything.ts",
      `
        import { defineApiResponse as response } from "../../lib/api-response.ts";

        const toList = () => ({ data: [] });
        const toDetail = async () => ({ id: 1 });

        export const ListArtists = response(toList);
        export const ArtistDetail = response(toDetail);
      `,
    );

    expect(contracts).toEqual([
      { mapperName: "toDetail", name: "ArtistDetail" },
      { mapperName: "toList", name: "ListArtists" },
    ]);
  });

  it("ignores files without a marker import", () => {
    expect(
      discoverApiResponseContracts(
        "unrelated.ts",
        `
          const defineApiResponse = (value: unknown) => value;
          export const NotAContract = defineApiResponse({ id: 1 });
        `,
      ),
    ).toEqual([]);
  });

  it("requires markers to be exported constants", () => {
    expect(() =>
      discoverApiResponseContracts(
        "invalid.ts",
        `
          import { defineApiResponse } from "../../lib/api-response.ts";
          const toDetail = () => ({ id: 1 });
          const ArtistDetail = defineApiResponse(toDetail);
        `,
      ),
    ).toThrow(/top-level exported const/);
  });

  it("requires a PascalCase contract name", () => {
    expect(() =>
      discoverApiResponseContracts(
        "invalid.ts",
        `
          import { defineApiResponse } from "../../lib/api-response.ts";
          const toDetail = () => ({ id: 1 });
          export const artistDetail = defineApiResponse(toDetail);
        `,
      ),
    ).toThrow(/PascalCase/);
  });

  it("requires exactly one mapper identifier", () => {
    expect(() =>
      discoverApiResponseContracts(
        "invalid.ts",
        `
          import { defineApiResponse } from "../../lib/api-response.ts";
          const toDetail = () => ({ id: 1 });
          export const ArtistDetail = defineApiResponse(() => toDetail());
        `,
      ),
    ).toThrow(/one mapper identifier/);
  });
});
