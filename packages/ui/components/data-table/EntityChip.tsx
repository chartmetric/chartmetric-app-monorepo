import type { FC, ReactNode } from "react";

import { Badge } from "@mantine/core";

import { CELL_TEXT_SIZE } from "./CellText";
import classes from "./Chips.module.css";

interface EntityChipProps {
  children: ReactNode;
  maw?: number;
}

/*
 * A soft-filled chip naming an entity inside a table cell (a key athlete, a
 * related record). Hover brightens toward the accent in dark mode and stays
 * gray in light mode: these chips are future navigation targets.
 */
export const EntityChip: FC<EntityChipProps> = ({ children, maw }) => (
  <Badge
    className={classes["entityChip"]}
    ff="monospace"
    fw={400}
    fz={CELL_TEXT_SIZE}
    {...(maw !== undefined && { maw })}
    radius="sm"
    size="sm"
    tt="none"
    variant="default"
  >
    {children}
  </Badge>
);
