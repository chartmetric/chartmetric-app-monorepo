import type { CSSProperties } from "react";

import classes from "./DataTable.module.css";

const STICKY_CELL_Z_INDEX = 1;
const STICKY_HEADER_CELL_Z_INDEX = 3;

export const stickyStyle = (
  left: number | undefined,
  isHeader: boolean,
): CSSProperties | undefined =>
  left === undefined
    ? undefined
    : {
        left,
        zIndex: isHeader ? STICKY_HEADER_CELL_Z_INDEX : STICKY_CELL_Z_INDEX,
      };

export const stickyClass = (
  left: number | undefined,
  isLast = false,
): string | undefined => {
  if (left === undefined) return undefined;
  return [classes["stickyCell"], isLast ? classes["lastStickyCell"] : undefined]
    .filter(Boolean)
    .join(" ");
};
