import type { ListAthletesQuery } from "./schemas.ts";

/**
 * Range filters that arrive as an independent minimum and maximum. TypeBox
 * validates each field on its own, so an inverted pair — a minimum above its
 * maximum — is only detectable once both values are known.
 */
const RANGE_BOUNDS = [
  ["minCmScore", "maxCmScore"],
  ["minFollowers", "maxFollowers"],
] as const satisfies readonly (readonly [
  keyof ListAthletesQuery,
  keyof ListAthletesQuery,
])[];

// Left unchecked, an inverted range returns an empty page instead of telling the
// caller the request was contradictory.
export const findInvertedRange = (
  query: ListAthletesQuery,
): string | undefined => {
  for (const [minimumKey, maximumKey] of RANGE_BOUNDS) {
    const minimum = query[minimumKey];
    const maximum = query[maximumKey];

    if (
      typeof minimum === "number" &&
      typeof maximum === "number" &&
      minimum > maximum
    ) {
      return `${minimumKey} must be less than or equal to ${maximumKey}`;
    }
  }

  return undefined;
};
