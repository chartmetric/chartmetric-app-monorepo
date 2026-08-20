import type { FC, ReactNode } from "react";

import { Group, type GroupProps, Text, VisuallyHidden } from "@mantine/core";

export const PillGroup: FC<{
  children: ReactNode;
  label: string;
  /** Self-evident groups (sport names) keep the label for AT only. */
  labelHidden?: boolean;
  wrap?: GroupProps["wrap"];
}> = ({ children, label, labelHidden = false, wrap = "nowrap" }) => (
  <Group gap={4} wrap={wrap}>
    {labelHidden ? (
      <VisuallyHidden>{label}</VisuallyHidden>
    ) : (
      <Text c="dimmed" size="xs" tt="uppercase">
        {label}
      </Text>
    )}
    {children}
  </Group>
);
