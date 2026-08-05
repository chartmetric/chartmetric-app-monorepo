import type { DataTableColumn } from "@repo/ui/data-table";
import type { ReactNode } from "react";

import type { Athlete, AthleteSortBy } from "../api/types";

export type AthleteColumnKey =
  | "age"
  | "club"
  | "gpsScore"
  | "igEngagementRate"
  | "igFollowers"
  | "igPosts"
  | "lastMatchDate"
  | "league"
  | "level"
  | "momentum"
  | "nationality"
  | "position"
  | "tiktokFollowers"
  | "tiktokHearts"
  | "tiktokLikes"
  | "tiktokPosts"
  | "tiktokVideos";

export type AthleteColumnSource =
  "Football" | "Instagram" | "Profile" | "TikTok";

export interface AthleteColumnDefinition {
  align: "center" | "left" | "right";
  key: AthleteColumnKey;
  minWidth: number;
  source: AthleteColumnSource;
  sortKey?: AthleteSortBy;
}

export interface AthleteColumnPack {
  keys: readonly AthleteColumnKey[];
  name: "Football" | "Instagram" | "Overview" | "Social" | "TikTok";
}

/** A column set the reader named and saved. */
export interface AthleteColumnPreset {
  keys: AthleteColumnKey[];
  name: string;
}

export type AthleteCellRenderers = Record<
  AthleteColumnKey,
  (athlete: Athlete) => ReactNode
>;

export type AthleteTableColumn = DataTableColumn<Athlete, AthleteSortBy>;
