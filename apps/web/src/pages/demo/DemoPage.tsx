import { useLingui } from "@lingui/react/macro";
import { Center, Group, Skeleton, Stack } from "@mantine/core";
import { Counter } from "@repo/ui/counter";
import { Header } from "@repo/ui/header";
import { type FC, Suspense } from "react";

import { DemoModalButton } from "./components/DemoModalButton";
import { ListenersChart } from "./components/ListenersChart";

export const DemoPage: FC = () => {
  const { t } = useLingui();

  return (
    <Center>
      <Stack align="center" gap="xl" p="xl" ta="center">
        <Header title={t`Web`} />
        <Suspense fallback={<Skeleton h={332} maw={480} w="100%" />}>
          <ListenersChart />
        </Suspense>
        <Group justify="center">
          <Counter />
          <DemoModalButton />
        </Group>
      </Stack>
    </Center>
  );
};
