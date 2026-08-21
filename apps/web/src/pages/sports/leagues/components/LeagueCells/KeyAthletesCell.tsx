import type { FC } from "react";

import { Group } from "@mantine/core";
import { CellText } from "@repo/ui/cell-text";
import { EntityChip } from "@repo/ui/entity-chip";

import type { KeyAthlete } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";
import { OverflowCount } from "./OverflowCount";

const PREVIEW_COUNT = 3;
const CHIP_MAX_WIDTH = 168;

interface KeyAthletesCellProps {
  athletes: readonly KeyAthlete[];
}

export const KeyAthletesCell: FC<KeyAthletesCellProps> = ({ athletes }) => {
  if (athletes.length === 0) {
    return <CellText c="dimmed">{EMPTY_CELL}</CellText>;
  }

  const preview = athletes.slice(0, PREVIEW_COUNT);
  const overflow = athletes.slice(PREVIEW_COUNT);

  return (
    <Group gap={4} miw={0} wrap="nowrap">
      {preview.map((athlete) => (
        <EntityChip key={athlete.id} maw={CHIP_MAX_WIDTH}>
          {athlete.name}
        </EntityChip>
      ))}
      <OverflowCount items={overflow.map((athlete) => athlete.name)} />
    </Group>
  );
};
