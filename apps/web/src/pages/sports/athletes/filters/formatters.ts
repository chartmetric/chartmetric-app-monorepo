import { useLingui } from "@lingui/react/macro";

export const useFilterBarLabel = (activeFilterCount: number): string => {
  const { t } = useLingui();
  const activeCount = String(activeFilterCount);

  if (activeFilterCount === 0) return t`Filters`;

  return t({
    comment: "Filter bar heading with the number of active filters",
    message: `Filters (${activeCount})`,
  });
};
