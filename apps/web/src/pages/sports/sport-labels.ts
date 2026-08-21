const WORD_SEPARATORS = /[\s_]+/u;

/**
 * Warehouse sport values arrive in whatever casing the ingesting pipeline
 * wrote — `football`, `american_football` — so every surface that shows one
 * renders it through here rather than showing the user the database.
 */
export const toSportLabel = (sport: string): string =>
  sport
    .split(WORD_SEPARATORS)
    .filter((word) => word !== "")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
