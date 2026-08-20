import type { FC } from "react";

import { type MantineSize, Text } from "@mantine/core";

interface NumericCellProps {
  /** The size the peer text cells on the same table use. */
  size: MantineSize;
  value: string;
}

/*
 * `ff="monospace"` resolves to the theme's `fontFamilyMonospace`, so the family
 * itself is never named here. The mono face carries tabular figures, which is
 * what makes a column of numbers line up digit-for-digit.
 */
export const NumericCell: FC<NumericCellProps> = ({ size, value }) => (
  <Text ff="monospace" size={size}>
    {value}
  </Text>
);
