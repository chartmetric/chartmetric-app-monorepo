import type { MantineColor } from "@mantine/core";

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

const UNKNOWN_SPORT_COLOR: MantineColor = "gray";
const UNMAPPED_SPORT_COLOR: MantineColor = "violet";

export const getSportColor = (sport: string | null): MantineColor => {
  if (sport === null) return UNKNOWN_SPORT_COLOR;

  const key = sport.toLowerCase().replaceAll(" ", "_");

  return SPORT_COLORS[key] ?? UNMAPPED_SPORT_COLOR;
};
