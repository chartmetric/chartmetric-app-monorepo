import type { FC } from "react";

import { faCheck } from "@fortawesome/pro-solid-svg-icons/faCheck";
import { faGlobe } from "@fortawesome/pro-solid-svg-icons/faGlobe";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { ActionIcon, Menu } from "@mantine/core";

import { dynamicActivate, isLocale, LOCALE_LABELS, storeLocale } from "../i18n";

export const LocaleSwitcher: FC = () => {
  const { i18n, t } = useLingui();

  return (
    <Menu>
      <Menu.Target>
        <ActionIcon aria-label={t`Language`} size="input-sm" variant="default">
          <FontAwesomeIcon icon={faGlobe} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {Object.entries(LOCALE_LABELS).map(([locale, label]) => (
          <Menu.Item
            key={locale}
            leftSection={
              locale === i18n.locale ? (
                <FontAwesomeIcon icon={faCheck} />
              ) : undefined
            }
            onClick={() => {
              if (!isLocale(locale)) {
                return;
              }
              storeLocale(locale);
              void dynamicActivate(locale);
            }}
          >
            {label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
