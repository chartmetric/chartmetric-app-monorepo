import type { FC } from "react";

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
      {isLight ? "Switch to dark mode" : "Switch to light mode"}
    </Button>
  );
};
