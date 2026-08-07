import { describe, expect, it } from "vitest";

import {
  COLLEGE_SPORT_LIST,
  toAthleteLevel,
  toSportLabel,
} from "./classification.ts";

describe("toAthleteLevel", () => {
  it("reads title-case college sports as college", () => {
    expect(toAthleteLevel("Football")).toBe("college");
    expect(toAthleteLevel("Women's Soccer")).toBe("college");
  });

  it("reads the lowercase spelling of the same sport as professional", () => {
    expect(toAthleteLevel("football")).toBe("professional");
    expect(toAthleteLevel("tennis")).toBe("professional");
  });

  it("does not widen the college set to other title-case sports", () => {
    expect(toAthleteLevel("Basketball")).toBe("professional");
    expect(toAthleteLevel("Softball")).toBe("professional");
  });

  it("treats an unknown or empty sport as professional", () => {
    expect(toAthleteLevel("")).toBe("professional");
    expect(toAthleteLevel("Kabaddi")).toBe("professional");
  });

  it("classifies every listed college sport as college", () => {
    for (const sport of COLLEGE_SPORT_LIST) {
      expect(toAthleteLevel(sport)).toBe("college");
    }
  });
});

describe("toSportLabel", () => {
  it("collapses the two spellings of a sport to one label", () => {
    expect(toSportLabel("football")).toBe("Football");
    expect(toSportLabel("Football")).toBe("Football");
  });

  it("title-cases every word of a multi-word sport", () => {
    expect(toSportLabel("Men's Soccer")).toBe("Men's Soccer");
    expect(toSportLabel("women's soccer")).toBe("Women's Soccer");
  });

  it("leaves an empty string alone", () => {
    expect(toSportLabel("")).toBe("");
  });
});
