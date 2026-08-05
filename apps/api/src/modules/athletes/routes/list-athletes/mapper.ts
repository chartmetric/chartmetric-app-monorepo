import type { ClubIndex } from "../../club/types.ts";
import type {
  Athlete,
  ListAthletesQuery,
  ListAthletesReply,
} from "./schemas.ts";
import type {
  AthleteListRow,
  AthleteMappingContext,
  SocialLink,
  SocialPlatform,
} from "./types.ts";

import { toAge, toDateString } from "../../../../lib/dates.ts";
import { toNumber, toPositiveCount } from "../../../../lib/numbers.ts";
import { emptyToNull } from "../../../../lib/strings.ts";
import { leaguesForClub, logoForClub } from "../../club/resolution.ts";
import { toAthleteLevel, toSportLabel } from "../../sport/classification.ts";

const PLATFORM_ORDER = [
  "instagram",
  "tiktok",
  "youtube",
  "twitter",
  "facebook",
] as const satisfies readonly SocialPlatform[];

// The cache stores handles only, so profile URLs are built from each platform's
// canonical pattern rather than read back from the warehouse.
const PLATFORM_URLS: Readonly<
  Record<SocialPlatform, (handle: string) => string>
> = {
  facebook: (handle) => `https://www.facebook.com/${handle}`,
  instagram: (handle) => `https://www.instagram.com/${handle}`,
  tiktok: (handle) => `https://www.tiktok.com/@${handle}`,
  twitter: (handle) => `https://x.com/${handle}`,
  youtube: (handle) => `https://www.youtube.com/@${handle}`,
};

const toSocialLinks = (
  handles: Readonly<Record<SocialPlatform, string | null | undefined>>,
): SocialLink[] => {
  const links: SocialLink[] = [];

  for (const platform of PLATFORM_ORDER) {
    const rawHandle = handles[platform];

    if (typeof rawHandle !== "string" || rawHandle === "") continue;

    const handle = rawHandle.startsWith("@") ? rawHandle.slice(1) : rawHandle;

    if (handle === "") continue;

    links.push({ handle, platform, url: PLATFORM_URLS[platform](handle) });
  }

  return links;
};

const toEspnLogoUrl = (
  league: string | null,
  teamAbbreviation: string | null,
): string | null =>
  league === null ||
  league === "" ||
  teamAbbreviation === null ||
  teamAbbreviation === ""
    ? null
    : `https://a.espncdn.com/i/teamlogos/${league.toLowerCase()}/500/${teamAbbreviation.toLowerCase()}.png`;

const NCAA_LEAGUE = "NCAA";

const toClub = (row: AthleteListRow, isCollege: boolean): string | null => {
  // College athletes show their school; basketball comes from its own roster
  // table; tennis is individual so it has no club at all.
  if (isCollege) return emptyToNull(row.on3_school);
  if (emptyToNull(row.basketball_team) !== null) return row.basketball_team;

  return emptyToNull(row.football_club);
};

const toLeagues = (
  row: AthleteListRow,
  isCollege: boolean,
  clubIndex: ClubIndex,
): string[] => {
  // The warehouse has no conference field, and every college athlete competes
  // under the NCAA umbrella, so that label is derived rather than looked up.
  if (isCollege) return [NCAA_LEAGUE];

  const basketballLeague = emptyToNull(row.basketball_league);

  if (basketballLeague !== null) return [basketballLeague];

  // Tennis has no team leagues; the athlete's tour is the closest analogue.
  const tour = emptyToNull(row.tennis_tour);

  if (tour !== null) return [tour];

  return [...leaguesForClub(clubIndex, emptyToNull(row.football_club))];
};

const toPosition = (row: AthleteListRow): string | null => {
  const basketballPosition = emptyToNull(row.basketball_position);

  if (basketballPosition !== null) return basketballPosition;

  if (emptyToNull(row.tennis_tour) !== null) {
    const ranking = toNumber(row.tennis_ranking);

    return ranking === null || ranking <= 0 ? null : `#${String(ranking)}`;
  }

  return emptyToNull(row.football_position);
};

const toTeamLogoUrl = (
  row: AthleteListRow,
  clubIndex: ClubIndex,
): string | null => {
  if (emptyToNull(row.basketball_team) !== null) {
    return toEspnLogoUrl(row.espn_league, row.espn_team_abbr);
  }

  return logoForClub(clubIndex, emptyToNull(row.football_club));
};

export const toAthlete = (
  row: AthleteListRow,
  { clubIndex, today }: AthleteMappingContext,
): Athlete => {
  const rawSport = row.sport ?? "";
  const level = toAthleteLevel(rawSport);
  const isCollege = level === "college";

  return {
    age: toAge(row.date_of_birth, today),
    club: toClub(row, isCollege),
    cmScore: toNumber(row.cm_score),
    gpsAtk: toNumber(row.gps_atk),
    gpsDef: toNumber(row.gps_def),
    gpsScore: toNumber(row.gps),
    id: row.profile_id,
    igEngagementRate: toNumber(row.ig_engagement_rate),
    igFollowers: toPositiveCount(row.ig_followers),
    igPosts: toPositiveCount(row.ig_posts),
    igVerified: toNumber(row.ig_verified) === 1,
    imageUrl: emptyToNull(row.image_url),
    lastMatchDate: toDateString(row.last_match_date),
    leagues: toLeagues(row, isCollege, clubIndex),
    level,
    momentumLabel: emptyToNull(row.momentum_label),
    momentumScore: toNumber(row.momentum),
    name: emptyToNull(row.name),
    nationality: emptyToNull(row.nationality),
    nationalTeam: emptyToNull(row.football_national_team),
    position: toPosition(row),
    rank: toNumber(row.athlete_rank),
    socialLinks: toSocialLinks({
      facebook: row.facebook_handle,
      instagram: row.ig_handle,
      tiktok: row.tiktok_handle,
      twitter: row.twitter_handle,
      youtube: row.youtube_handle,
    }),
    sport: rawSport === "" ? null : toSportLabel(rawSport),
    teamLogoUrl: toTeamLogoUrl(row, clubIndex),
    // The cache is authoritative for TikTok followers but is backfilled on a
    // delay, so snapshot history stands in while it is still zero or unset.
    tiktokFollowers:
      toPositiveCount(row.tiktok_followers) ??
      toPositiveCount(row.snapshot_tiktok_followers),
    tiktokHearts: toPositiveCount(row.tiktok_hearts),
    tiktokLikes: toPositiveCount(row.snapshot_tiktok_likes),
    tiktokPosts: toPositiveCount(row.snapshot_tiktok_posts),
    tiktokVideos: toPositiveCount(row.tiktok_videos),
    turnedPro: toPositiveCount(row.turned_pro_year),
    type: emptyToNull(row.type),
  };
};

export const toAthleteList = (
  rows: AthleteListRow[],
  pagination: ListAthletesQuery,
  total: number,
  context: AthleteMappingContext,
): ListAthletesReply => ({
  data: rows.map((row) => toAthlete(row, context)),
  meta: {
    limit: pagination.limit,
    offset: pagination.offset,
    total,
  },
});
