import type { FC, ReactNode } from "react";

import { Group, type MantineSize, Text } from "@mantine/core";

import classes from "./NumericCell.module.css";

interface NumericCellProps {
  /** Leading pictogram (e.g. a people icon before an athlete count). */
  icon?: ReactNode;
  /** Row labels (ordinals) read muted; measurements read graphite ink. */
  muted?: boolean;
  /** The size the peer text cells on the same table use. */
  size: MantineSize;
  value: string;
}

/*
 * `ff="monospace"` resolves to the theme's `fontFamilyMonospace`, so the family
 * itself is never named here. The mono face carries tabular figures, which is
 * what makes a column of numbers line up digit-for-digit.
 */
export const NumericCell: FC<NumericCellProps> = ({
  icon,
  muted = false,
  size,
  value,
}) => {
  const text = (
    <Text
      className={muted ? classes["muted"] : classes["value"]}
      ff="monospace"
      size={size}
    >
      {value}
    </Text>
  );

  if (icon === undefined) return text;

  return (
    <Group gap={6} justify="flex-end" wrap="nowrap">
      <span aria-hidden="true">{icon}</span>
      {text}
    </Group>
  );
};
