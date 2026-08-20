import type { FC } from "react";

import { Group, Image, Text } from "@mantine/core";

import type { Athlete } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";
import { CELL_TEXT_SIZE } from "./cell-typography";

interface ClubCellProps {
  athlete: Athlete;
}

export const ClubCell: FC<ClubCellProps> = ({ athlete }) => {
  if (athlete.club === null) return <Text c="dimmed">{EMPTY_CELL}</Text>;

  return (
    <Group gap={6} wrap="nowrap">
      {athlete.teamLogoUrl === null ? null : (
        <Image alt="" h={16} src={athlete.teamLogoUrl} w={16} />
      )}
      <Text size={CELL_TEXT_SIZE} truncate>
        {athlete.club}
      </Text>
    </Group>
  );
};
