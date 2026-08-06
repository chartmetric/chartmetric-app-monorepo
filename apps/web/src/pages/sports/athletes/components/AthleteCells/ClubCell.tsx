import type { FC } from "react";

import { Group, Image, Text } from "@mantine/core";

import type { Athlete } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";

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
      <Text size="sm" truncate>
        {athlete.club}
      </Text>
    </Group>
  );
};
