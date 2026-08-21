import type { FC } from "react";

import { Text, type TextProps } from "@mantine/core";

/*
 * The one type scale for table cell text. Every data cell renders through
 * this component so the scale has a single owner; a column whose text is
 * visibly larger than its neighbours reads as emphasis the data does not
 * justify. Identity names pass size="sm" — one token above their row.
 */
export const CELL_TEXT_SIZE = "xs";

export const CellText: FC<TextProps & { children?: React.ReactNode }> = (
  props,
) => <Text size={CELL_TEXT_SIZE} {...props} />;
