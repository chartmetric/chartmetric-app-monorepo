import type {
  AthleteColumnDefinition,
  AthleteColumnKey,
  AthleteColumnPack,
} from "./types";

export const ATHLETE_COLUMNS: readonly AthleteColumnDefinition[] = [
  { align: "left", key: "position", minWidth: 70, source: "Football" },
  { align: "left", key: "club", minWidth: 140, source: "Football" },
  { align: "left", key: "league", minWidth: 150, source: "Football" },
  { align: "left", key: "nationality", minWidth: 100, source: "Profile" },
  { align: "right", key: "age", minWidth: 60, source: "Profile" },
  { align: "left", key: "lastMatchDate", minWidth: 110, source: "Football" },
  {
    align: "right",
    key: "igFollowers",
    minWidth: 110,
    sortKey: "igFollowers",
    source: "Instagram",
  },
  {
    align: "right",
    key: "igPosts",
    minWidth: 80,
    sortKey: "igPosts",
    source: "Instagram",
  },
  {
    align: "right",
    key: "tiktokFollowers",
    minWidth: 110,
    sortKey: "tiktokFollowers",
    source: "TikTok",
  },
  { align: "right", key: "tiktokPosts", minWidth: 80, source: "TikTok" },
  {
    align: "right",
    key: "tiktokLikes",
    minWidth: 100,
    sortKey: "tiktokLikes",
    source: "TikTok",
  },
  { align: "right", key: "tiktokHearts", minWidth: 100, source: "TikTok" },
  { align: "right", key: "tiktokVideos", minWidth: 90, source: "TikTok" },
  {
    align: "right",
    key: "igEngagementRate",
    minWidth: 100,
    source: "Instagram",
  },
  { align: "left", key: "level", minWidth: 100, source: "Profile" },
  { align: "center", key: "gpsScore", minWidth: 70, source: "Football" },
  { align: "center", key: "momentum", minWidth: 110, source: "Football" },
];

export const DEFAULT_ATHLETE_COLUMNS: readonly AthleteColumnKey[] = [
  "position",
  "club",
  "league",
  "nationality",
  "age",
  "lastMatchDate",
  "igFollowers",
  "igPosts",
];

export const ATHLETE_COLUMN_PACKS: readonly AthleteColumnPack[] = [
  {
    keys: [
      "position",
      "club",
      "league",
      "nationality",
      "igFollowers",
      "tiktokFollowers",
    ],
    name: "Overview",
  },
  {
    keys: [
      "position",
      "club",
      "league",
      "nationality",
      "age",
      "lastMatchDate",
      "gpsScore",
      "momentum",
    ],
    name: "Football",
  },
  { keys: ["igFollowers", "igPosts"], name: "Instagram" },
  {
    keys: ["tiktokFollowers", "tiktokLikes", "tiktokPosts"],
    name: "TikTok",
  },
  {
    keys: ["igFollowers", "igPosts", "tiktokFollowers", "tiktokLikes"],
    name: "Social",
  },
];
