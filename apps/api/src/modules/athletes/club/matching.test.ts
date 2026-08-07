import { describe, expect, it } from "vitest";

import { findFuzzyClubMatch, normalizeClubTokens } from "./matching.ts";

const tokens = (name: string): string[] => [...normalizeClubTokens(name)];

const match = (clubName: string, candidates: string[]): string | undefined =>
  findFuzzyClubMatch(
    clubName,
    candidates.map((name) => ({ name })),
    new Map(),
  )?.name;

describe("normalizeClubTokens", () => {
  it("strips generic club-name tokens", () => {
    expect(tokens("AS Roma")).toEqual(["roma"]);
    expect(tokens("FC Barcelona")).toEqual(["barcelona"]);
    expect(tokens("Manchester United")).toEqual(["manchester"]);
  });

  it("folds accents and punctuation", () => {
    expect(tokens("Atlético Madrid")).toEqual(["atletico", "madrid"]);
    expect(tokens("Saint-Étienne")).toEqual(["saint", "etienne"]);
  });

  it("expands a known acronym that shares no tokens with the official name", () => {
    expect(tokens("PSG")).toEqual(["paris", "saint", "germain"]);
  });

  it("returns nothing for a name made only of stopwords", () => {
    expect(tokens("FC")).toEqual([]);
    expect(tokens(" ".repeat(3))).toEqual([]);
  });
});

describe("findFuzzyClubMatch", () => {
  it("matches a short cache name to the official name", () => {
    expect(match("Roma", ["AS Roma", "Real Madrid"])).toBe("AS Roma");
  });

  it("matches when the cache name is longer than the official name", () => {
    expect(match("Inter Milan", ["Inter", "AC Milan"])).toBe("Inter");
  });

  it("bridges an acronym to the spelled-out name", () => {
    expect(match("PSG", ["Paris Saint Germain", "Nice"])).toBe(
      "Paris Saint Germain",
    );
  });

  it("prefers the candidate whose token count is closest", () => {
    expect(match("Roma", ["Roma W", "AS Roma"])).toBe("AS Roma");
  });

  it("breaks a tie on the shorter official name", () => {
    expect(match("Inter", ["Inter Milan", "Inter M"])).toBe("Inter M");
  });

  it("returns undefined rather than guessing when no side is a subset", () => {
    expect(match("Roma", ["Real Madrid", "Chelsea"])).toBeUndefined();
  });

  it("returns undefined when the club name normalizes to nothing", () => {
    expect(match("FC", ["AS Roma"])).toBeUndefined();
  });
});
