import type { FC } from "react";

import { Badge, Group, Text } from "@mantine/core";

import type { KeyAthlete } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";
import { CELL_TEXT_SIZE } from "./cell-typography";
import classes from "./LeagueCells.module.css";
import { OverflowCount } from "./OverflowCount";

const PREVIEW_COUNT = 3;
const CHIP_MAX_WIDTH = 168;

interface KeyAthletesCellProps {
  athletes: readonly KeyAthlete[];
}

export const KeyAthletesCell: FC<KeyAthletesCellProps> = ({ athletes }) => {
  if (athletes.length === 0) {
    return (
      <Text c="dimmed" size={CELL_TEXT_SIZE}>
        {EMPTY_CELL}
      </Text>
    );
  }

  const preview = athletes.slice(0, PREVIEW_COUNT);
  const overflow = athletes.slice(PREVIEW_COUNT);

  return (
    <Group gap={4} miw={0} wrap="nowrap">
      {preview.map((athlete) => (
        <Badge
          className={classes["athleteChip"]}
          ff="monospace"
          fw={400}
          fz={CELL_TEXT_SIZE}
          key={athlete.id}
          maw={CHIP_MAX_WIDTH}
          radius="sm"
          size="sm"
          tt="none"
          variant="default"
        >
          {athlete.name}
        </Badge>
      ))}
      <OverflowCount items={overflow.map((athlete) => athlete.name)} />
    </Group>
  );
};
