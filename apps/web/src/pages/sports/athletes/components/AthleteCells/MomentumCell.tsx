import type { FC } from "react";

import { Badge, Group, Text } from "@mantine/core";

import { EMPTY_CELL } from "../../../../../lib/formatting";

interface MomentumCellProps {
  label: string | null;
  score: number | null;
  steadyLabel: string;
}

const HOT_TERMS = ["hot", "fire", "rising", "up"];
const COLD_TERMS = ["cold", "falling", "down"];
const MOMENTUM_HOT_THRESHOLD = 15;

type MomentumTrend = "cold" | "hot" | "steady";

const MOMENTUM_COLORS: Readonly<Record<MomentumTrend, string>> = {
  cold: "blue",
  hot: "orange",
  steady: "gray",
};

const MOMENTUM_INDICATORS: Readonly<Record<MomentumTrend, string>> = {
  cold: "▼",
  hot: "▲",
  steady: "—",
};

const momentumTrend = (
  label: string | null,
  score: number | null,
): MomentumTrend => {
  const normalized = (label ?? "").toLocaleLowerCase();

  if (
    HOT_TERMS.some((term) => normalized.includes(term)) ||
    (score !== null && score > MOMENTUM_HOT_THRESHOLD)
  ) {
    return "hot";
  }
  if (
    COLD_TERMS.some((term) => normalized.includes(term)) ||
    (score !== null && score < -MOMENTUM_HOT_THRESHOLD)
  ) {
    return "cold";
  }

  return "steady";
};

export const MomentumCell: FC<MomentumCellProps> = ({
  label,
  score,
  steadyLabel,
}) => {
  if (score === null && label === null)
    return <Text c="dimmed">{EMPTY_CELL}</Text>;

  const trend = momentumTrend(label, score);
  const color = MOMENTUM_COLORS[trend];
  const indicator = MOMENTUM_INDICATORS[trend];

  return (
    <Badge color={color} variant="light">
      <Group component="span" gap={4} wrap="nowrap">
        <span aria-hidden="true">{indicator}</span>
        {label ?? steadyLabel}
      </Group>
    </Badge>
  );
};
