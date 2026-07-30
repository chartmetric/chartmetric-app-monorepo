import { describe, expect, it } from "vitest";

import { buildApp } from "../../../app.ts";
import { stubClickhouse, testConfig } from "../../../tests/helpers.ts";

const rows = {
  "new_vertical.cm_artist": [
    {
      code2: "US",
      id: 42,
      image_url: "https://img/artist-42.jpg",
      name: "Artist Name",
      record_label: "Label A",
    },
    { code2: "", id: 43, image_url: "", name: "No Profile", record_label: "" },
  ],
  "new_vertical.profiles": [
    {
      id: 1,
      image_url: "https://img/profile-1.jpg",
      name: "Profile Name",
      source_id: "42",
    },
  ],
};

describe("GET /artists", () => {
  it.each(["/app/artists", "/v1/artists"])(
    "returns the merged list on %s",
    async (url) => {
      const app = await buildApp({
        clickhouse: stubClickhouse(rows),
        config: testConfig,
      });

      const response = await app.inject({ method: "GET", url });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: [
          {
            countryCode: "US",
            id: 42,
            imageUrl: "https://img/profile-1.jpg",
            name: "Profile Name",
            recordLabel: "Label A",
          },
          {
            countryCode: null,
            id: 43,
            imageUrl: null,
            name: "No Profile",
            recordLabel: null,
          },
        ],
        meta: { limit: 50, offset: 0 },
      });
      await app.close();
    },
  );

  it("rejects a limit above the maximum", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(rows),
      config: testConfig,
    });

    const response = await app.inject({
      method: "GET",
      url: "/v1/artists?limit=9999",
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("echoes the requested pagination in meta", async () => {
    const app = await buildApp({
      clickhouse: stubClickhouse(),
      config: testConfig,
    });

    const response = await app.inject({
      method: "GET",
      url: "/app/artists?limit=5&offset=10",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [],
      meta: { limit: 5, offset: 10 },
    });
    await app.close();
  });
});
