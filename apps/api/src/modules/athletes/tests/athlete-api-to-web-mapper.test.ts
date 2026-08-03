import { describe, expect, it } from "vitest";

import { toAthleteList } from "../athlete-api-to-web-mapper.ts";

describe("toAthleteList", () => {
  it("normalizes empty fields and echoes pagination", () => {
    expect(
      toAthleteList(
        [
          {
            cm_score: 87.4,
            image_url: "",
            name: "Alex Morgan",
            nationality: "United States",
            profile_id: 42,
            sport: "Football",
            type: "athlete",
          },
          {
            cm_score: null,
            image_url: null,
            name: "",
            nationality: null,
            profile_id: 43,
            sport: "",
            type: "",
          },
        ],
        { limit: 25, offset: 50 },
      ),
    ).toEqual({
      data: [
        {
          cmScore: 87.4,
          id: 42,
          imageUrl: null,
          name: "Alex Morgan",
          nationality: "United States",
          sport: "Football",
          type: "athlete",
        },
        {
          cmScore: null,
          id: 43,
          imageUrl: null,
          name: null,
          nationality: null,
          sport: null,
          type: null,
        },
      ],
      meta: { limit: 25, offset: 50 },
    });
  });
});
