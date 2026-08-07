import { describe, expect, it } from "vitest";

import type { ClubIndex } from "../../../club/types.ts";
import type { AthleteFilterOptionRow } from "../types.ts";

import { toAthleteFilterOptions } from "../mapper.ts";

const clubIndex: ClubIndex = {
  clubsByLeague: new Map([
    ["Serie A", ["Roma"]],
    ["Premier League", ["Arsenal"]],
  ]),
  leaguesByClub: new Map([
    ["Roma", ["Serie A"]],
    ["Arsenal", ["Premier League"]],
  ]),
  logoByClub: new Map(),
};

const emptyIndex: ClubIndex = {
  clubsByLeague: new Map(),
  leaguesByClub: new Map(),
  logoByClub: new Map(),
};

const row = (
  overrides: Partial<AthleteFilterOptionRow> = {},
): AthleteFilterOptionRow => ({
  basketball_league: null,
  basketball_team: null,
  cm_score: null,
  football_club: null,
  nationality: null,
  on3_school: null,
  sport: "football",
  tennis_tour: null,
  ...overrides,
});

describe("toAthleteFilterOptions", () => {
  it("returns nullable bounds when no rows have a CM score", () => {
    expect(
      toAthleteFilterOptions([row({ sport: "" })], emptyIndex).cmScore,
    ).toEqual({ max: null, min: null });
  });

  it("collapses mixed source casing into one sport option", () => {
    const options = toAthleteFilterOptions(
      [row({ sport: "football" }), row({ sport: "Football" })],
      emptyIndex,
    );

    expect(options.sports).toEqual([{ count: 2, value: "Football" }]);
  });

  it("splits sports by level using the college ingestion values", () => {
    const options = toAthleteFilterOptions(
      [
        row({ sport: "football" }),
        row({ sport: "Football" }),
        row({ sport: "Volleyball" }),
      ],
      emptyIndex,
    );

    expect(options.sportsByLevel).toEqual({
      college: ["Football", "Volleyball"],
      professional: ["Football"],
    });
  });

  it("groups football leagues and clubs through the club catalog", () => {
    const options = toAthleteFilterOptions(
      [row({ football_club: "Roma" }), row({ football_club: "Arsenal" })],
      clubIndex,
    );

    expect(options.leaguesBySport).toEqual({
      Football: ["Premier League", "Serie A"],
    });
    expect(options.clubsBySport).toEqual({
      Football: { "Premier League": ["Arsenal"], "Serie A": ["Roma"] },
    });
  });

  it("files a club with no known league under Other", () => {
    const options = toAthleteFilterOptions(
      [row({ football_club: "Unknown FC" })],
      emptyIndex,
    );

    expect(options.clubsBySport).toEqual({
      Football: { Other: ["Unknown FC"] },
    });
    expect(options.leaguesBySport).toEqual({});
  });

  it("keeps same-city basketball teams in separate league buckets", () => {
    const options = toAthleteFilterOptions(
      [
        row({
          basketball_league: "WNBA",
          basketball_team: "Atlanta Dream",
          sport: "basketball",
        }),
        row({
          basketball_league: "NBA",
          basketball_team: "Atlanta Hawks",
          sport: "basketball",
        }),
      ],
      emptyIndex,
    );

    expect(options.clubsBySport).toEqual({
      Basketball: { NBA: ["Atlanta Hawks"], WNBA: ["Atlanta Dream"] },
    });
    expect(options.leaguesBySport).toEqual({ Basketball: ["NBA", "WNBA"] });
  });

  it("uses the tour as the tennis league and records no club", () => {
    const options = toAthleteFilterOptions(
      [
        row({ sport: "tennis", tennis_tour: "ATP" }),
        row({ sport: "tennis", tennis_tour: "WTA" }),
      ],
      emptyIndex,
    );

    expect(options.leaguesBySport).toEqual({ Tennis: ["ATP", "WTA"] });
    expect(options.clubsBySport).toEqual({});
  });

  it("labels every college sport under NCAA", () => {
    const options = toAthleteFilterOptions(
      [row({ sport: "Gymnastics" }), row({ sport: "Volleyball" })],
      emptyIndex,
    );

    expect(options.leaguesBySport).toEqual({
      Gymnastics: ["NCAA"],
      Volleyball: ["NCAA"],
    });
  });

  it("offers the school a college athlete is listed under", () => {
    const options = toAthleteFilterOptions(
      [
        row({ on3_school: "LSU", sport: "Gymnastics" }),
        row({ on3_school: "", sport: "Volleyball" }),
      ],
      emptyIndex,
    );

    expect(options.clubsBySport).toEqual({ Gymnastics: { NCAA: ["LSU"] } });
  });
});
