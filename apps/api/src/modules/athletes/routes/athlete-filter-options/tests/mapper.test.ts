import { describe, expect, it } from "vitest";

import { toAthleteFilterOptions } from "../mapper.ts";

describe("toAthleteFilterOptions", () => {
  it("counts categorical values and derives CM score bounds", () => {
    expect(
      toAthleteFilterOptions([
        {
          cm_score: 87.4,
          nationality: "United States",
          sport: "Football",
          type: "athlete",
        },
        {
          cm_score: 72.1,
          nationality: "Canada",
          sport: "Football",
          type: "athlete",
        },
        {
          cm_score: null,
          nationality: null,
          sport: "Tennis",
          type: "",
        },
      ]),
    ).toEqual({
      cmScore: { max: 87.4, min: 72.1 },
      nationalities: [
        { count: 1, value: "Canada" },
        { count: 1, value: "United States" },
      ],
      sports: [
        { count: 2, value: "Football" },
        { count: 1, value: "Tennis" },
      ],
      types: [{ count: 2, value: "athlete" }],
    });
  });

  it("returns nullable bounds when no rows have a CM score", () => {
    expect(
      toAthleteFilterOptions([
        {
          cm_score: null,
          nationality: null,
          sport: "",
          type: "",
        },
      ]).cmScore,
    ).toEqual({ max: null, min: null });
  });
});
