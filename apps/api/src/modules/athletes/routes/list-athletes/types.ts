import type { WarehouseNumber } from "../../../../lib/numbers.ts";
import type { ClubIndex } from "../../club/types.ts";
import type { selectRoster } from "./filters.ts";

export interface AthleteListRow {
  profile_id: number;
  name: string | null;
  sport: string | null;
  type: string | null;
  nationality: string | null;
  image_url: string | null;
  cm_score: number | null;
  date_of_birth: string | null;
  turned_pro_year: number | null;
  football_club: string | null;
  football_position: string | null;
  football_national_team: string | null;
  tennis_tour: string | null;
  tennis_ranking: number | null;
  ig_followers: WarehouseNumber;
  ig_posts: WarehouseNumber;
  ig_verified: number | null;
  ig_engagement_rate: number | null;
  ig_handle: string | null;
  tiktok_followers: WarehouseNumber;
  tiktok_hearts: WarehouseNumber;
  tiktok_videos: WarehouseNumber;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  twitter_handle: string | null;
  facebook_handle: string | null;
  athlete_rank: WarehouseNumber;
  snapshot_tiktok_posts: WarehouseNumber;
  snapshot_tiktok_likes: WarehouseNumber;
  snapshot_tiktok_followers: WarehouseNumber;
  last_match_date: string | null;
  on3_school: string | null;
  espn_league: string | null;
  espn_team_abbr: string | null;
  basketball_team: string | null;
  basketball_league: string | null;
  basketball_position: string | null;
  gps: number | null;
  gps_atk: number | null;
  gps_def: number | null;
  momentum: number | null;
  momentum_label: string | null;
}

export interface AthleteCountRow {
  total: number | string;
}

export interface ListAthletesOptions {
  /**
   * Club names the requested leagues resolve to. Football league membership
   * lives in the team catalog rather than on the athlete row, so the route
   * translates a league filter into the club names it covers before querying.
   * An empty array means the requested leagues matched no club and the result
   * must be empty.
   */
  leagueClubNames?: readonly string[];
}

export type RosterBuilder = ReturnType<typeof selectRoster>;

export type CteAlias =
  | "espn_basketball"
  | "last_match"
  | "on3_school"
  | "roster_rank"
  | "tiktok_latest";

export type SocialPlatform =
  "facebook" | "instagram" | "tiktok" | "twitter" | "youtube";

export interface SocialLink {
  handle: string;
  platform: string;
  url: string;
}

export interface AthleteMappingContext {
  clubIndex: ClubIndex;
  today: Date;
}
