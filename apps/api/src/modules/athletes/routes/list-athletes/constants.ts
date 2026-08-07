import type { DatabaseQueryFactory } from "../../../../lib/database.ts";
import type { CteAlias } from "./types.ts";

import { selectBasketballRoster } from "../../basketball/roster.ts";
import {
  selectEspnBasketball,
  selectGpsScores,
  selectLastMatch,
  selectMomentum,
  selectOn3School,
  selectRosterRank,
  selectTiktokLatest,
} from "./ctes.ts";

export const ENRICHMENT_CTES = [
  ["roster_rank", selectRosterRank],
  ["tiktok_latest", selectTiktokLatest],
  ["last_match", selectLastMatch],
  ["on3_school", selectOn3School],
  ["espn_basketball", selectEspnBasketball],
  ["basketball_roster", selectBasketballRoster],
  ["gps_scores", selectGpsScores],
  ["momentum_scores", selectMomentum],
] as const satisfies readonly (readonly [CteAlias, DatabaseQueryFactory])[];

// A joined table cannot carry `FINAL`, so every source is read through a CTE.
export const ENRICHMENT_JOINS = [
  "roster_rank",
  "tiktok_latest",
  "last_match",
  "on3_school",
  "espn_basketball",
  "basketball_roster",
  "gps_scores",
  "momentum_scores",
] as const satisfies readonly CteAlias[];

export const CACHE_PROFILE_ID = "new_vertical.athletes_cache.profile_id";

export const CTE_FACTORIES = new Map<string, DatabaseQueryFactory>(
  ENRICHMENT_CTES,
);

export type EnrichmentSource = (typeof ENRICHMENT_JOINS)[number];
