import { describe, expect, it } from "vitest";

import type {
  FootballCompetitionRow,
  FootballTeamCompetitionRow,
  FootballTeamRow,
} from "./types.ts";

import {
  buildClubIndex,
  clubsForLeagues,
  leaguesForClub,
  logoForClub,
} from "./lookup.ts";

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
