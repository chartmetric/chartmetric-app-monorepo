import type { FC } from "react";

import { faCheck } from "@fortawesome/pro-regular-svg-icons/faCheck";
import { faLanguage } from "@fortawesome/pro-regular-svg-icons/faLanguage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { ActionIcon, Menu } from "@mantine/core";

import {
  dynamicActivate,
  isLocale,
  LOCALE_LABELS,
  storeLocale,
} from "../../i18n";

export const LocaleSwitcher: FC = () => {
  const { i18n, t } = useLingui();

  return (
    <Menu>
      <Menu.Target>
        <ActionIcon aria-label={t`Language`} size="input-sm" variant="default">
          <FontAwesomeIcon icon={faLanguage} />
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
