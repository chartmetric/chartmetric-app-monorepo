import type { FC } from "react";

import { Stack, Tooltip } from "@mantine/core";
import { CellText } from "@repo/ui/cell-text";

import type { Athlete } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";

interface LeagueCellProps {
  athlete: Athlete;
  moreLabel: (count: number) => string;
}

export const LeagueCell: FC<LeagueCellProps> = ({ athlete, moreLabel }) => {
  const [primary, ...rest] = athlete.leagues;

  if (primary === undefined)
    return <CellText c="dimmed">{EMPTY_CELL}</CellText>;

  return (
    <Stack gap={0} miw={0}>
      <Tooltip
        disabled={rest.length === 0}
        label={athlete.leagues.join(", ")}
        multiline
      >
        <CellText truncate>{primary}</CellText>
      </Tooltip>
      {rest.length === 0 ? null : (
        <CellText c="dimmed">{moreLabel(rest.length)}</CellText>
      )}
    </Stack>
  );
};
