import type { FC } from "react";

import { Group, Text } from "@mantine/core";

import type { League } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";
import { CELL_TEXT_SIZE } from "./cell-typography";
import { OverflowCount } from "./OverflowCount";

const PREVIEW_COUNT = 3;

interface NationalitiesCellProps {
  nationalities: League["nationalities"];
}

export const NationalitiesCell: FC<NationalitiesCellProps> = ({
  nationalities,
}) => {
  if (nationalities.length === 0) {
    return (
      <Text c="dimmed" size={CELL_TEXT_SIZE}>
        {EMPTY_CELL}
      </Text>
    );
  }

  const preview = nationalities.slice(0, PREVIEW_COUNT);
  const overflow = nationalities.slice(PREVIEW_COUNT);

  return (
    <Group gap={4} miw={0} wrap="nowrap">
      <Text miw={0} size={CELL_TEXT_SIZE} truncate>
        {preview.join(", ")}
      </Text>
      <OverflowCount items={overflow} />
    </Group>
  );
};
