import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Select } from "@mantine/core";

import { dynamicActivate, isLocale, LOCALE_LABELS } from "../i18n";

const LOCALE_OPTIONS = Object.entries(LOCALE_LABELS).map(([value, label]) => ({
  label,
  value,
}));

export const LocaleSwitcher: FC = () => {
  const { i18n, t } = useLingui();

  return (
    <Select
      allowDeselect={false}
      aria-label={t`Language`}
      data={LOCALE_OPTIONS}
      onChange={(value) => {
        if (value !== null && isLocale(value)) {
          void dynamicActivate(value);
        }
      }}
      value={i18n.locale}
    />
  );
};
