import type { FC } from "react";

import { Badge, Text } from "@mantine/core";

import { EMPTY_CELL } from "../../../../../lib/formatting";

interface GpsCellProps {
  score: number | null;
}

const gpsColor = (score: number): string => {
  if (score >= 75) return "teal";

  return score >= 50 ? "yellow" : "red";
};

export const GpsCell: FC<GpsCellProps> = ({ score }) =>
  score === null ? (
    <Text c="dimmed">{EMPTY_CELL}</Text>
  ) : (
    <Badge color={gpsColor(score)} variant="light">
      {Math.round(score)}
    </Badge>
  );
