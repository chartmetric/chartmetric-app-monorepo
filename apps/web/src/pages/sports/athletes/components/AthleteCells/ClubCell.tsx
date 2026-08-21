import type { FC } from "react";

import { Group, Image } from "@mantine/core";
import { CellText } from "@repo/ui/cell-text";

import type { Athlete } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";

interface ClubCellProps {
  athlete: Athlete;
}

export const ClubCell: FC<ClubCellProps> = ({ athlete }) => {
  if (athlete.club === null)
    return <CellText c="dimmed">{EMPTY_CELL}</CellText>;

  return (
    <Group gap={6} wrap="nowrap">
      {athlete.teamLogoUrl === null ? null : (
        <Image alt="" h={16} src={athlete.teamLogoUrl} w={16} />
      )}
      <CellText truncate>{athlete.club}</CellText>
    </Group>
  );
};
