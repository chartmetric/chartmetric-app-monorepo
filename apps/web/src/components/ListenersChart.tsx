import type { FC } from "react";

import { faCompress } from "@fortawesome/pro-solid-svg-icons/faCompress";
import { faExpand } from "@fortawesome/pro-solid-svg-icons/faExpand";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trans, useLingui } from "@lingui/react/macro";
import { AreaChart } from "@mantine/charts";
import { ActionIcon, Group, Paper, Text, Title } from "@mantine/core";
import { useFullscreenElement } from "@mantine/hooks";

const getMonthlyListeners = (
  t: (message: { comment: string; message: string }) => string,
): {
  listeners: number;
  month: string;
}[] => [
  {
    listeners: 890,
    month: t({
      comment: "Abbreviated month name on the chart's x-axis",
      message: "Jan",
    }),
  },
  {
    listeners: 1240,
    month: t({
      comment: "Abbreviated month name on the chart's x-axis",
      message: "Feb",
    }),
  },
  {
    listeners: 1180,
    month: t({
      comment: "Abbreviated month name on the chart's x-axis",
      message: "Mar",
    }),
  },
  {
    listeners: 1710,
    month: t({
      comment: "Abbreviated month name on the chart's x-axis",
      message: "Apr",
    }),
  },
  {
    listeners: 2350,
    month: t({
      comment: "Abbreviated month name on the chart's x-axis",
      message: "May",
    }),
  },
  {
    listeners: 2810,
    month: t({
      comment: "Abbreviated month name on the chart's x-axis",
      message: "Jun",
    }),
  },
];

export const ListenersChart: FC = () => {
  const { t } = useLingui();
  const { fullscreen, ref, toggle } = useFullscreenElement<HTMLDivElement>();
  const monthlyListeners = getMonthlyListeners(t);

  return (
    <Paper
      maw={fullscreen ? undefined : 480}
      p="lg"
      radius="md"
      ref={ref}
      w="100%"
      withBorder
    >
      <Group align="flex-start" justify="space-between">
        <div>
          <Title order={4} ta="left">
            <Trans>Monthly listeners</Trans>
          </Title>
          <Text c="dimmed" size="sm" ta="left">
            <Trans>Sample data, first half of the year</Trans>
          </Text>
        </div>
        <ActionIcon
          aria-label={fullscreen ? t`Exit full screen` : t`Full screen`}
          onClick={() => {
            void toggle();
          }}
          variant="subtle"
        >
          <FontAwesomeIcon icon={fullscreen ? faCompress : faExpand} />
        </ActionIcon>
      </Group>
      <AreaChart
        curveType="monotone"
        data={monthlyListeners}
        dataKey="month"
        h={fullscreen ? "calc(100vh - 140px)" : 220}
        mt="md"
        series={[{ color: "blue.6", name: "listeners" }]}
      />
    </Paper>
  );
};
