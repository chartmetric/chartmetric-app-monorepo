import type { FC } from "react";

import { Center, Group, Stack } from "@mantine/core";
import { Counter } from "@repo/ui/counter";
import { Header } from "@repo/ui/header";

import { ColorSchemeToggle } from "./components/ColorSchemeToggle";
import { DemoModalButton } from "./components/DemoModalButton";
import { ListenersChart } from "./components/ListenersChart";

export const App: FC = () => (
  <Center mih="100vh">
    <Stack align="center" gap="xl" p="xl" ta="center">
      <Header title="Web" />
      <ColorSchemeToggle />
      <ListenersChart />
      <Group justify="center">
        <Counter />
        <DemoModalButton />
      </Group>
    </Stack>
  </Center>
);
