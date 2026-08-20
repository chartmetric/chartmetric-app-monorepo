import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { AppShell, Burger, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet, useLocation } from "react-router";

import { findVerticalByPathname } from "../verticals";
import { AuthControls } from "./components/AuthControls";
import { ColorSchemeToggle } from "./components/ColorSchemeToggle";
import { LocaleSwitcher } from "./components/LocaleSwitcher";
import { VerticalNav } from "./components/VerticalNav";
import { VerticalSelector } from "./components/VerticalSelector";

export const Layout: FC = () => {
  const { t } = useLingui();
  const location = useLocation();
  const activeVertical = findVerticalByPathname(location.pathname);
  const [navbarOpened, { close: closeNavbar, toggle: toggleNavbar }] =
    useDisclosure();

  return (
    <AppShell
      header={{ height: 56 }}
      layout="alt"
      navbar={{
        breakpoint: "sm",
        collapsed: { mobile: !navbarOpened },
        width: 220,
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="md">
          <Burger
            aria-label={t`Toggle navigation`}
            hiddenFrom="sm"
            onClick={toggleNavbar}
            opened={navbarOpened}
            size="sm"
          />
          <Group gap="xs" ml="auto">
            <AuthControls />
            <ColorSchemeToggle />
            <LocaleSwitcher />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar bg="teal.9" p="md" withBorder={false}>
        <AppShell.Section>
          <Group align="flex-start" justify="space-between" wrap="nowrap">
            <VerticalSelector onNavigate={closeNavbar} />
            <Burger
              aria-label={t`Toggle navigation`}
              color="white"
              hiddenFrom="sm"
              onClick={toggleNavbar}
              opened={navbarOpened}
              size="sm"
            />
          </Group>
        </AppShell.Section>
        <AppShell.Section grow mt="md">
          <VerticalNav
            links={activeVertical.navLinks}
            onNavigate={closeNavbar}
          />
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};
