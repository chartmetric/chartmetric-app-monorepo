import type { FC } from "react";

import { Group, Text } from "@mantine/core";

import { EMPTY_CELL } from "../../../../../lib/formatting";
import { OverflowCount } from "./OverflowCount";

const PREVIEW_COUNT = 3;

interface NationalitiesCellProps {
  nationalities: readonly string[];
}

export const NationalitiesCell: FC<NationalitiesCellProps> = ({
  nationalities,
}) => {
  if (nationalities.length === 0) return <Text c="dimmed">{EMPTY_CELL}</Text>;

  const preview = nationalities.slice(0, PREVIEW_COUNT);
  const overflow = nationalities.slice(PREVIEW_COUNT);

  return (
    <Group gap={4} miw={0} wrap="nowrap">
      <Text miw={0} size="sm" truncate>
        {preview.join(", ")}
      </Text>
      <OverflowCount items={overflow} />
    </Group>
  );
};
