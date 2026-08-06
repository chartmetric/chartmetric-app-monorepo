import { describe, expect, it } from "vitest";

import type {
  FootballCompetitionRow,
  FootballTeamCompetitionRow,
  FootballTeamRow,
} from "./types.ts";

import {
  buildClubIndex,
  clubsForLeagues,
  findFuzzyClubMatch,
  leaguesForClub,
  logoForClub,
  normalizeClubTokens,
} from "./club-utilities.ts";

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

const teams: FootballTeamRow[] = [
  { logo_url: "https://logos/roma.png", name: "AS Roma", team_id: 1 },
  { logo_url: "https://logos/inter.png", name: "Inter", team_id: 2 },
  { logo_url: "", name: "Unlisted FC", team_id: 3 },
];

const competitions: FootballCompetitionRow[] = [
  { competition_id: 10, name: "Serie A" },
  { competition_id: 11, name: "Coppa Italia" },
];

const teamCompetitions: FootballTeamCompetitionRow[] = [
  { competition_id: 10, team_id: 1 },
  { competition_id: 11, team_id: 1 },
  { competition_id: 10, team_id: 2 },
];

describe("buildClubIndex", () => {
  it("resolves roster club names through exact and fuzzy matches", () => {
    const index = buildClubIndex(teams, competitions, teamCompetitions, [
      "Roma",
      "Inter Milan",
    ]);

    expect(leaguesForClub(index, "Roma")).toEqual(["Coppa Italia", "Serie A"]);
    expect(leaguesForClub(index, "Inter Milan")).toEqual(["Serie A"]);
    expect(logoForClub(index, "Roma")).toBe("https://logos/roma.png");
  });

  it("keeps a club with no competition rows but reports no leagues", () => {
    const index = buildClubIndex(teams, competitions, teamCompetitions, [
      "Unlisted FC",
    ]);

    expect(leaguesForClub(index, "Unlisted FC")).toEqual([]);
    expect(logoForClub(index, "Unlisted FC")).toBeNull();
  });

  it("omits a roster club that matches nothing in the catalog", () => {
    const index = buildClubIndex(teams, competitions, teamCompetitions, [
      "Boca Juniors",
    ]);

    expect(leaguesForClub(index, "Boca Juniors")).toEqual([]);
    expect(logoForClub(index, "Boca Juniors")).toBeNull();
  });

  it("skips absent, empty, and duplicated roster names", () => {
    const index = buildClubIndex(teams, competitions, teamCompetitions, [
      null,
      undefined,
      "",
      "Roma",
      "Roma",
    ]);

    expect(clubsForLeagues(index, ["Serie A"])).toEqual(["Roma"]);
  });

  it("inverts the index so a league resolves to its roster clubs", () => {
    const index = buildClubIndex(teams, competitions, teamCompetitions, [
      "Roma",
      "Inter Milan",
    ]);

    expect(
      clubsForLeagues(index, ["Serie A"]).toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toEqual(["Inter Milan", "Roma"]);
    expect(clubsForLeagues(index, ["Coppa Italia"])).toEqual(["Roma"]);
    expect(clubsForLeagues(index, ["La Liga"])).toEqual([]);
  });

  it("reports no league or crest for an athlete with no club", () => {
    const index = buildClubIndex(teams, competitions, teamCompetitions, [
      "Roma",
    ]);

    expect(leaguesForClub(index, null)).toEqual([]);
    expect(logoForClub(index, null)).toBeNull();
  });
});
