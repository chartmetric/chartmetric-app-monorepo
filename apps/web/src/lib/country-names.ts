import { useLingui } from "@lingui/react/macro";
import { useCallback, useMemo } from "react";

export type CountryNameFormatter = (countryCode: string) => string;

/**
 * `Intl.DisplayNames` throws on codes it cannot parse, and the warehouse stores
 * country codes unvalidated, so an unknown code falls back to itself.
 */
export const useCountryName = (): CountryNameFormatter => {
  const { i18n } = useLingui();
  const formatter = useMemo(
    () => new Intl.DisplayNames([i18n.locale], { type: "region" }),
    [i18n.locale],
  );

  return useCallback(
    (countryCode: string): string => {
      try {
        return formatter.of(countryCode) ?? countryCode;
      } catch {
        return countryCode;
      }
    },
    [formatter],
  );
};
