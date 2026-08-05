import type { AthleteColumnKey } from "./types";

import { ATHLETE_COLUMNS } from "./registry";

export const ATHLETE_COLUMNS_STORAGE_KEY = "sports.athletes.visibleColumns";
export const ATHLETE_COLUMN_GROUPS_STORAGE_KEY = "sports.athletes.columnGroups";

const COLUMN_KEYS = new Set<string>(ATHLETE_COLUMNS.map(({ key }) => key));

export const isAthleteColumnKey = (key: string): key is AthleteColumnKey =>
  COLUMN_KEYS.has(key);

export const isAthleteColumnKeyList = (
  candidate: unknown,
): candidate is AthleteColumnKey[] =>
  Array.isArray(candidate) &&
  candidate.every((item) => typeof item === "string" && COLUMN_KEYS.has(item));

export const isAthleteColumnPresetList = (
  candidate: unknown,
): candidate is { keys: AthleteColumnKey[]; name: string }[] =>
  Array.isArray(candidate) &&
  candidate.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as { name?: unknown }).name === "string" &&
      isAthleteColumnKeyList((item as { keys?: unknown }).keys),
  );
