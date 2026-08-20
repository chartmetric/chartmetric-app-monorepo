import type { FC } from "react";

import { Stack, Text, Tooltip } from "@mantine/core";

import type { Athlete } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";
import { CELL_TEXT_SIZE } from "./cell-typography";

interface LeagueCellProps {
  athlete: Athlete;
  moreLabel: (count: number) => string;
}

export const LeagueCell: FC<LeagueCellProps> = ({ athlete, moreLabel }) => {
  const [primary, ...rest] = athlete.leagues;

  if (primary === undefined) return <Text c="dimmed">{EMPTY_CELL}</Text>;

  return (
    <Stack gap={0} miw={0}>
      <Tooltip
        disabled={rest.length === 0}
        label={athlete.leagues.join(", ")}
        multiline
      >
        <Text size={CELL_TEXT_SIZE} truncate>
          {primary}
        </Text>
      </Tooltip>
      {rest.length === 0 ? null : (
        <Text c="dimmed" size="xs">
          {moreLabel(rest.length)}
        </Text>
      )}
    </Stack>
  );
};
