import type { AthleteLevel } from "./types.ts";

// The on3 college-athlete ingestion batch is the only writer that uses
// title-case sport values in `athletes_cache`; professional rows arrive
// lowercase ("football"). No level, division, or source column exists on the
// table, so casing is the only available signal.
//
// `Basketball`, `Women's Basketball`, and `Softball` also appear in title case
// but are deliberately absent: the upstream dashboard this contract mirrors
// classifies only these five as college, and widening the set here would move
// athletes between levels relative to it.
const COLLEGE_SPORT_VALUES: ReadonlySet<string> = new Set([
  "Football",
  "Gymnastics",
  "Men's Soccer",
  "Volleyball",
  "Women's Soccer",
]);

export const COLLEGE_SPORT_LIST: readonly string[] = [...COLLEGE_SPORT_VALUES];

export const toAthleteLevel = (rawSport: string): AthleteLevel =>
  COLLEGE_SPORT_VALUES.has(rawSport) ? "college" : "professional";

// Collapsing both casings to one label keeps the sport filter from listing the
// same sport twice; `level` is what separates the two populations.
export const toSportLabel = (rawSport: string): string =>
  rawSport
    .split(" ")
    .map((word) =>
      word === ""
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
