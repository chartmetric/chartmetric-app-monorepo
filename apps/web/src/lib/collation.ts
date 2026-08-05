import { useLingui } from "@lingui/react/macro";
import { useMemo } from "react";

/**
 * Compares display names in the reader's locale. Sorting without one is not
 * merely approximate: the default order is by UTF-16 code unit, which puts every
 * accented name after every ASCII one — "Örebro" lands after "Zurich" rather
 * than between "Beşiktaş" and "Saint-Étienne".
 */
export const useNameComparator = (): ((
  left: string,
  right: string,
) => number) => {
  const { i18n } = useLingui();

  return useMemo(() => {
    const collator = new Intl.Collator(i18n.locale);

    return (left: string, right: string) => collator.compare(left, right);
  }, [i18n.locale]);
};
