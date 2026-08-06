import { useLingui } from "@lingui/react/macro";
import { useMemo } from "react";

export interface AbbreviatedNumberOptions {
  decimals?: number;
  signed?: boolean;
}

export type NumberFormatter = (value: number) => string;

export const useAbbreviatedNumber = ({
  decimals = 1,
  signed = false,
}: AbbreviatedNumberOptions = {}): NumberFormatter => {
  const { i18n } = useLingui();

  return useMemo(() => {
    const formatter = new Intl.NumberFormat(i18n.locale, {
      compactDisplay: "short",
      maximumFractionDigits: decimals,
      notation: "compact",
      signDisplay: signed ? "exceptZero" : "auto",
    });

    return (value: number): string => formatter.format(value);
  }, [decimals, i18n.locale, signed]);
};
