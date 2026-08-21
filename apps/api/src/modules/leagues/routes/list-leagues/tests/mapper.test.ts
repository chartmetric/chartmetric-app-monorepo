import { describe, expect, it } from "vitest";

import type { LeagueListRow } from "../types.ts";

import { toLeague, toLeagueList } from "../mapper.ts";

const row = (overrides: Partial<LeagueListRow> = {}): LeagueListRow => ({
  aggregated_ig_followers: "184000000",
  country_flag_url: "https://media.api-sports.io/flags/es.svg",
  id: "2805663106422782827",
  key_athletes: [
    [686, "Kylian Mbappé"],
    [706, "Vinícius Júnior"],
  ],
  league_type: "club_league",
  logo_url: "https://media.api-sports.io/football/leagues/140.png",
  name: "La Liga",
  nationalities: ["Spain", "Brazil"],
  scope: "Spain",
  sport: "football",
  tracked_athletes: "89",
  ...overrides,
});

describe("toLeague", () => {
  it("maps a catalog row onto the reply shape", () => {
    expect(toLeague(row())).toEqual({
      country: "Spain",
      countryFlagUrl: "https://media.api-sports.io/flags/es.svg",
      id: "2805663106422782827",
      igReach: 184_000_000,
      keyAthletes: [
        { id: 686, name: "Kylian Mbappé" },
        { id: 706, name: "Vinícius Júnior" },
      ],
      leagueType: "club_league",
      logoUrl: "https://media.api-sports.io/football/leagues/140.png",
      name: "La Liga",
      nationalities: ["Brazil", "Spain"],
      sport: "football",
      trackedAthletes: 89,
    });
  });

  it.each(["world", "World"])("reports scope %s as no country", (scope) => {
    expect(toLeague(row({ scope })).country).toBeNull();
  });

  it("keeps the identifier a string so a UInt64 survives the round trip", () => {
    expect(toLeague(row({ id: "18446744073709551615" })).id).toBe(
      "18446744073709551615",
    );
  });

  it("normalizes empty strings and absent values to null", () => {
    const league = toLeague(
      row({
        country_flag_url: "",
        league_type: "",
        logo_url: "",
        name: "",
        scope: "",
        sport: null,
      }),
    );

    expect(league).toMatchObject({
      country: null,
      countryFlagUrl: null,
      leagueType: null,
      logoUrl: null,
      name: null,
      sport: null,
    });
  });

  it("drops a key athlete with no name and keeps the follower order", () => {
    const league = toLeague(
      row({
        key_athletes: [
          [686, "Kylian Mbappé"],
          [999, ""],
          [706, "Vinícius Júnior"],
        ],
      }),
    );

    expect(league.keyAthletes).toEqual([
      { id: 686, name: "Kylian Mbappé" },
      { id: 706, name: "Vinícius Júnior" },
    ]);
  });

  it("returns nationalities distinct, blank-free and collated", () => {
    const league = toLeague(
      row({ nationalities: ["Spain", "", "Argentina", "Spain", "Ãland"] }),
    );

    expect(league.nationalities).toEqual(["Ãland", "Argentina", "Spain"]);
  });

  it("counts an untracked league as zero athletes and zero reach", () => {
    const league = toLeague(
      row({
        aggregated_ig_followers: null,
        key_athletes: [],
        tracked_athletes: null,
      }),
    );

    expect(league.trackedAthletes).toBe(0);
    expect(league.igReach).toBe(0);
  });
});

describe("toLeagueList", () => {
  it("echoes the requested window alongside the unpaged total", () => {
    const reply = toLeagueList([row()], { limit: 25, offset: 50 }, 16);

    expect(reply.data).toHaveLength(1);
    expect(reply.meta).toEqual({ limit: 25, offset: 50, total: 16 });
  });
});
