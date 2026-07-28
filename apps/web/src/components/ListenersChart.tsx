import type { FC } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import { AreaChart } from "@mantine/charts";
import { Paper, Text, Title } from "@mantine/core";

export const ListenersChart: FC = () => {
  const { t } = useLingui();
  const monthlyListeners = [
    { listeners: 890, month: t`Jan` },
    { listeners: 1240, month: t`Feb` },
    { listeners: 1180, month: t`Mar` },
    { listeners: 1710, month: t`Apr` },
    { listeners: 2350, month: t`May` },
    { listeners: 2810, month: t`Jun` },
  ];

  return (
    <Paper maw={480} p="lg" radius="md" w="100%" withBorder>
      <Title order={4} ta="left">
        <Trans>Monthly listeners</Trans>
      </Title>
      <Text c="dimmed" size="sm" ta="left">
        <Trans>Sample data, first half of the year</Trans>
      </Text>
      <AreaChart
        curveType="monotone"
        data={monthlyListeners}
        dataKey="month"
        h={220}
        mt="md"
        series={[{ color: "blue.6", name: "listeners" }]}
      />
    </Paper>
  );
};
