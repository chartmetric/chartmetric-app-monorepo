import type { FC } from "react";

import { faMoon } from "@fortawesome/pro-regular-svg-icons/faMoon";
import { faSun } from "@fortawesome/pro-regular-svg-icons/faSun";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import {
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";

export const ColorSchemeToggle: FC = () => {
  const { t } = useLingui();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const isLight = computedColorScheme === "light";

  return (
    <ActionIcon
      aria-label={isLight ? t`Switch to dark mode` : t`Switch to light mode`}
      onClick={() => {
        setColorScheme(isLight ? "dark" : "light");
      }}
      size="input-sm"
      variant="default"
    >
      <FontAwesomeIcon icon={isLight ? faMoon : faSun} />
    </ActionIcon>
  );
};
