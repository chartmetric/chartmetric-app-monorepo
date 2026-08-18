import type { MantineColor } from "@mantine/core";

/**
 * Maps a sport name to a Mantine color so every surface that displays
 * a sport (identity cell, filter chips, etc.) stays consistent.
 * Unknown or null sports fall back to "dimmed" so they don't compete
 * visually with the athlete name.
 */
const SPORT_COLORS: Readonly<Record<string, MantineColor>> = {
  american_football: "orange",
  athletics: "yellow",
  baseball: "blue",
  basketball: "orange",
  cricket: "lime",
  cycling: "indigo",
  football: "teal",
  golf: "green",
  rugby: "green",
  soccer: "teal",
  swimming: "cyan",
  tennis: "grape",
  volleyball: "cyan",
};

export const getSportColor = (sport: string | null): MantineColor => {
  const key = sport?.toLowerCase().replaceAll(" ", "_") ?? "";

  return SPORT_COLORS[key] ?? "gray";
};
