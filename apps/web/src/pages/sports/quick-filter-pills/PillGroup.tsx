import type { FC, ReactNode } from "react";

import { Group, type GroupProps, Text } from "@mantine/core";

export const PillGroup: FC<{
  children: ReactNode;
  label: string;
  wrap?: GroupProps["wrap"];
}> = ({ children, label, wrap = "nowrap" }) => (
  <Group gap={4} wrap={wrap}>
    <Text c="dimmed" size="xs" tt="uppercase">
      {label}
    </Text>
    {children}
  </Group>
);
