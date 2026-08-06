import { useLingui } from "@lingui/react/macro";
import { useMemo } from "react";

export const useFilterBarLabel = (activeFilterCount: number): string => {
  const { t } = useLingui();
  const activeCount = String(activeFilterCount);

  if (activeFilterCount === 0) return t`Filters`;

  return t({
    comment: "Filter bar heading with the number of active filters",
    message: `Filters (${activeCount})`,
  });
};

export const useCompactNumberFormatter = (): Intl.NumberFormat => {
  const { i18n } = useLingui();

  return useMemo(
    () => new Intl.NumberFormat(i18n.locale, { notation: "compact" }),
    [i18n.locale],
  );
};
