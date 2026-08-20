import type { FC } from "react";

import { Text } from "@mantine/core";

import { CELL_TEXT_SIZE } from "./cell-typography";

interface NumericCellProps {
  value: string;
}

export const NumericCell: FC<NumericCellProps> = ({ value }) => (
  <Text size={CELL_TEXT_SIZE}>{value}</Text>
);
