import { useLingui } from "@lingui/react/macro";
import { useMemo } from "react";

/** What a table cell shows when a value is absent, in every list. */
export const EMPTY_CELL = "—";

/**
 * The number and date formats every entity list shares, built once per locale so
 * a column does not construct an `Intl` instance per row.
 */
export const useListFormatters = (): {
  compact: Intl.NumberFormat;
  date: Intl.DateTimeFormat;
  percent: Intl.NumberFormat;
  plain: Intl.NumberFormat;
} => {
  const { i18n } = useLingui();

  return useMemo(
    () => ({
      compact: new Intl.NumberFormat(i18n.locale, {
        maximumFractionDigits: 1,
        notation: "compact",
      }),
      date: new Intl.DateTimeFormat(i18n.locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      percent: new Intl.NumberFormat(i18n.locale, {
        maximumFractionDigits: 1,
        style: "percent",
      }),
      plain: new Intl.NumberFormat(i18n.locale),
    }),
    [i18n.locale],
  );
};

export const formatCount = (
  value: number | null,
  formatter: Intl.NumberFormat,
): string => (value === null ? EMPTY_CELL : formatter.format(value));

export const formatDate = (
  value: string | null,
  formatter: Intl.DateTimeFormat,
): string => {
  if (value === null) return EMPTY_CELL;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? EMPTY_CELL : formatter.format(parsed);
};
