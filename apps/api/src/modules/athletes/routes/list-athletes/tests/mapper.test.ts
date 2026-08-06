import { describe, expect, it } from "vitest";

import type { ClubIndex } from "../../../club/types.ts";
import type { AthleteListRow } from "../queries.ts";
import type { Athlete } from "../schemas.ts";

import { toAthlete, toAthleteList } from "../mapper.ts";

const TODAY = new Date("2026-08-04T00:00:00Z");

const clubIndex: ClubIndex = {
  clubsByLeague: new Map([["Serie A", ["Roma"]]]),
  leaguesByClub: new Map([["Roma", ["Serie A"]]]),
  logoByClub: new Map([["Roma", "https://logos.example/roma.png"]]),
};

const emptyIndex: ClubIndex = {
  clubsByLeague: new Map(),
  leaguesByClub: new Map(),
  logoByClub: new Map(),
};

const baseRow: AthleteListRow = {
  athlete_rank: 7,
  basketball_league: null,
  basketball_position: null,
  basketball_team: null,
  cm_score: 87.4,
  date_of_birth: "1996-07-01",
  espn_league: null,
  espn_team_abbr: null,
  facebook_handle: null,
  football_club: null,
  football_national_team: null,
  football_position: null,
  gps: null,
  gps_atk: null,
  gps_def: null,
  ig_engagement_rate: null,
  ig_followers: null,
  ig_handle: null,
  ig_posts: null,
  ig_verified: null,
  image_url: null,
  last_match_date: null,
  momentum: null,
  momentum_label: null,
  name: "Alex Morgan",
  nationality: "United States",
  on3_school: null,
  profile_id: 42,
  snapshot_tiktok_likes: null,
  snapshot_tiktok_posts: null,
  sport: "football",
  tennis_ranking: null,
  tennis_tour: null,
  tiktok_followers: null,
  tiktok_handle: null,
  tiktok_hearts: null,
  tiktok_videos: null,
  turned_pro_year: null,
  twitter_handle: null,
  type: "athlete",
  youtube_handle: null,
};

const map = (overrides: Partial<AthleteListRow>, index = clubIndex): Athlete =>
  toAthlete({ ...baseRow, ...overrides }, { clubIndex: index, today: TODAY });

describe("toAthlete", () => {
  it("normalizes sport casing and derives professional level", () => {
    const athlete = map({ sport: "football" });

    expect(athlete.sport).toBe("Football");
    expect(athlete.level).toBe("professional");
  });

  it("treats the title-cased college ingestion values as college level", () => {
    const athlete = map({ on3_school: "LSU", sport: "Women's Soccer" });

    expect(athlete.level).toBe("college");
    expect(athlete.sport).toBe("Women's Soccer");
    expect(athlete.club).toBe("LSU");
    expect(athlete.leagues).toEqual(["NCAA"]);
  });

  it("resolves football league and crest through the club catalog", () => {
    const athlete = map({ football_club: "Roma", football_position: "FW" });

    expect(athlete.club).toBe("Roma");
    expect(athlete.leagues).toEqual(["Serie A"]);
    expect(athlete.teamLogoUrl).toBe("https://logos.example/roma.png");
    expect(athlete.position).toBe("FW");
  });

  it("leaves league and crest blank when the club does not resolve", () => {
    const athlete = map({ football_club: "Unknown FC" }, emptyIndex);

    expect(athlete.club).toBe("Unknown FC");
    expect(athlete.leagues).toEqual([]);
    expect(athlete.teamLogoUrl).toBeNull();
  });

  it("prefers the basketball roster for club, league, and position", () => {
    const athlete = map({
      basketball_league: "NBA",
      basketball_position: "PG",
      basketball_team: "Los Angeles Lakers",
      espn_league: "NBA",
      espn_team_abbr: "LAL",
      football_club: "Roma",
      sport: "basketball",
    });

    expect(athlete.club).toBe("Los Angeles Lakers");
    expect(athlete.leagues).toEqual(["NBA"]);
    expect(athlete.position).toBe("PG");
    expect(athlete.teamLogoUrl).toBe(
      "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
    );
  });

  it("uses the tour as league and the ranking as position for tennis", () => {
    const athlete = map({
      sport: "tennis",
      tennis_ranking: 3,
      tennis_tour: "ATP",
    });

    expect(athlete.club).toBeNull();
    expect(athlete.leagues).toEqual(["ATP"]);
    expect(athlete.position).toBe("#3");
  });

  it("reports an unranked tennis player as having no position", () => {
    const athlete = map({
      sport: "tennis",
      tennis_ranking: 0,
      tennis_tour: "WTA",
    });

    expect(athlete.position).toBeNull();
  });

  it("keeps a genuine zero GPS score distinct from a missing one", () => {
    expect(map({ gps: 0, gps_atk: 0, gps_def: 0 }).gpsScore).toBe(0);
    expect(map({ gps: null }).gpsScore).toBeNull();
  });

  it("reports zero social counts as absent rather than zero", () => {
    const athlete = map({
      ig_followers: 0,
      tiktok_hearts: 0,
      tiktok_videos: 0,
    });

    expect(athlete.igFollowers).toBeNull();
    expect(athlete.tiktokHearts).toBeNull();
    expect(athlete.tiktokVideos).toBeNull();
  });

  it("coerces 64-bit counts delivered as strings", () => {
    const athlete = map({ athlete_rank: "7", ig_followers: "678142770" });

    expect(athlete.igFollowers).toBe(678_142_770);
    expect(athlete.rank).toBe(7);
  });

  it("computes age from the date of birth", () => {
    expect(map({ date_of_birth: "1996-07-01" }).age).toBe(30);
    expect(map({ date_of_birth: "1996-09-01" }).age).toBe(29);
    expect(map({ date_of_birth: null }).age).toBeNull();
  });

  it("discards the zero-date sentinel for last match date", () => {
    expect(map({ last_match_date: "0000-00-00" }).lastMatchDate).toBeNull();
    expect(map({ last_match_date: "2026-07-06" }).lastMatchDate).toBe(
      "2026-07-06",
    );
  });

  it("builds social links from handles in platform order", () => {
    const athlete = map({
      facebook_handle: "",
      ig_handle: "@cristiano",
      tiktok_handle: "cristiano",
      youtube_handle: "cr7",
    });

    expect(athlete.socialLinks).toEqual([
      {
        handle: "cristiano",
        platform: "instagram",
        url: "https://www.instagram.com/cristiano",
      },
      {
        handle: "cristiano",
        platform: "tiktok",
        url: "https://www.tiktok.com/@cristiano",
      },
      {
        handle: "cr7",
        platform: "youtube",
        url: "https://www.youtube.com/@cr7",
      },
    ]);
  });

  it("normalizes empty strings to null", () => {
    const athlete = map({
      football_national_team: "",
      image_url: "",
      name: "",
      nationality: null,
      sport: "",
      type: "",
    });

    expect(athlete.name).toBeNull();
    expect(athlete.imageUrl).toBeNull();
    expect(athlete.nationality).toBeNull();
    expect(athlete.sport).toBeNull();
    expect(athlete.type).toBeNull();
    expect(athlete.nationalTeam).toBeNull();
  });

  it("maps verification from the cache flag", () => {
    expect(map({ ig_verified: 1 }).igVerified).toBe(true);
    expect(map({ ig_verified: 0 }).igVerified).toBe(false);
    expect(map({ ig_verified: null }).igVerified).toBe(false);
  });
});

describe("toAthleteList", () => {
  it("echoes pagination and the filtered total", () => {
    const reply = toAthleteList([baseRow], { limit: 25, offset: 50 }, 2948, {
      clubIndex,
      today: TODAY,
    });

    expect(reply.data).toHaveLength(1);
    expect(reply.meta).toEqual({ limit: 25, offset: 50, total: 2948 });
  });
});
