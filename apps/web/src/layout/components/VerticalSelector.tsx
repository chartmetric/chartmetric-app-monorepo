import type { FC } from "react";

import { faChevronDown } from "@fortawesome/pro-regular-svg-icons/faChevronDown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trans, useLingui } from "@lingui/react/macro";
import { Group, Image, Menu, Stack, Text, UnstyledButton } from "@mantine/core";
import { useLocation, useNavigate } from "react-router";

import cmLogo from "../../assets/cm-logo.svg";
import { findVerticalByPathname, VERTICALS } from "../../verticals";
import { NAV_MUTED_INK } from "../nav-ink";

interface VerticalSelectorProps {
  onNavigate: () => void;
}

export const VerticalSelector: FC<VerticalSelectorProps> = ({ onNavigate }) => {
  const { t } = useLingui();
  const location = useLocation();
  const navigate = useNavigate();
  const activeVertical = findVerticalByPathname(location.pathname);

  return (
    <Menu position="bottom-start" width={200}>
      <Menu.Target>
        <UnstyledButton aria-label={t`Switch vertical`}>
          <Group gap="xs" wrap="nowrap">
            <Image alt="" h={32} src={cmLogo} w={32} />
            <Stack gap={2}>
              <Text c="white" fw={600} size="sm">
                <Trans>Chartmetric Dash</Trans>
              </Text>
              <Group c={NAV_MUTED_INK} gap={4}>
                <Text size="xs" tt="uppercase">
                  {t(activeVertical.label)}
                </Text>
                <FontAwesomeIcon icon={faChevronDown} size="2xs" />
              </Group>
            </Stack>
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {VERTICALS.map((vertical) => (
          <Menu.Item
            key={vertical.id}
            onClick={() => {
              onNavigate();
              void navigate(vertical.homePath);
            }}
          >
            {t(vertical.label)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
