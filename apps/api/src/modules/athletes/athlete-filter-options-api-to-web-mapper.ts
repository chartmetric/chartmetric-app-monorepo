import type { AthleteFilterOptionRow } from "./queries.ts";

import { defineApiResponse } from "../../lib/api-response.ts";

interface FilterOption {
  count: number;
  value: string;
}

const countOptions = (values: (string | null)[]): FilterOption[] => {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (value === null || value === "") continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts]
    .map(([value, count]) => ({ count, value }))
    .toSorted((left, right) => {
      const countDifference = right.count - left.count;

      return countDifference === 0
        ? left.value.localeCompare(right.value)
        : countDifference;
    });
};

const scoreBounds = (
  rows: AthleteFilterOptionRow[],
): { max: number | null; min: number | null } => {
  let max: number | null = null;
  let min: number | null = null;

  for (const { cm_score: score } of rows) {
    if (score === null) continue;
    max = max === null ? score : Math.max(max, score);
    min = min === null ? score : Math.min(min, score);
  }

  return { max, min };
};

type AthleteFilterOptionsMapper = (rows: AthleteFilterOptionRow[]) => unknown;

export const toAthleteFilterOptions = ((rows) => ({
  cmScore: scoreBounds(rows),
  nationalities: countOptions(rows.map(({ nationality }) => nationality)),
  sports: countOptions(rows.map(({ sport }) => sport)),
  types: countOptions(rows.map(({ type }) => type)),
})) satisfies AthleteFilterOptionsMapper;

export const AthleteFilterOptions = defineApiResponse(toAthleteFilterOptions);
