import { useLingui } from "@lingui/react/macro";
import { Center, Group, Skeleton, Stack } from "@mantine/core";
import { Counter } from "@repo/ui/counter";
import { Header } from "@repo/ui/header";
import { type FC, lazy, Suspense } from "react";

import { ColorSchemeToggle } from "./components/ColorSchemeToggle";
import { DemoModalButton } from "./components/DemoModalButton";
import { LocaleSwitcher } from "./components/LocaleSwitcher";

// Charts pull in recharts (~115 kB gzipped) — keep it out of the initial bundle.
const ListenersChart = lazy(async () => {
  const module = await import("./components/ListenersChart");
  return { default: module.ListenersChart };
});

export const App: FC = () => {
  const { t } = useLingui();

  return (
    <Center mih="100vh">
      <Stack align="center" gap="xl" p="xl" ta="center">
        <Header title={t`Web`} />
        <Group justify="center">
          <ColorSchemeToggle />
          <LocaleSwitcher />
        </Group>
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
