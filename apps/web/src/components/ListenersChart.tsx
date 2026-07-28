import type { FC } from "react";

import { AreaChart } from "@mantine/charts";
import { Paper, Text, Title } from "@mantine/core";

const MONTHLY_LISTENERS = [
  { listeners: 890, month: "Jan" },
  { listeners: 1240, month: "Feb" },
  { listeners: 1180, month: "Mar" },
  { listeners: 1710, month: "Apr" },
  { listeners: 2350, month: "May" },
  { listeners: 2810, month: "Jun" },
];

export const ListenersChart: FC = () => (
  <Paper maw={480} p="lg" radius="md" w="100%" withBorder>
    <Title order={4} ta="left">
      Monthly listeners
    </Title>
    <Text c="dimmed" size="sm" ta="left">
      Sample data, first half of the year
    </Text>
    <AreaChart
      curveType="monotone"
      data={MONTHLY_LISTENERS}
      dataKey="month"
      h={220}
      mt="md"
      series={[{ color: "blue.6", name: "listeners" }]}
    />
  </Paper>
);
