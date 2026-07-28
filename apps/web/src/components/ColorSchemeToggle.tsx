import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import {
  Button,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";

export const ColorSchemeToggle: FC = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const isLight = computedColorScheme === "light";

  return (
    <Button
      onClick={() => {
        setColorScheme(isLight ? "dark" : "light");
      }}
      variant="default"
    >
      {isLight ? (
        <Trans>Switch to dark mode</Trans>
      ) : (
        <Trans>Switch to light mode</Trans>
      )}
    </Button>
  );
};
