import type { FC } from "react";

import { Text, Tooltip } from "@mantine/core";

import { toCountryFlag } from "../../../../../lib/country-flags";

interface CountryFlagProps {
  nationality: string | null;
}

export const CountryFlag: FC<CountryFlagProps> = ({ nationality }) => {
  const flag = toCountryFlag(nationality);

  if (flag === null || nationality === null) return null;

  return (
    <Tooltip label={nationality}>
      <Text aria-label={nationality} component="span" role="img" size="sm">
        {flag}
      </Text>
    </Tooltip>
  );
};
