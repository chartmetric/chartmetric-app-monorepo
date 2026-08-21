import type { FC } from "react";

import { Button } from "@mantine/core";

interface PillProps {
  isActive: boolean;
  label: string;
  onToggle: () => void;
}

export const Pill: FC<PillProps> = ({ isActive, label, onToggle }) => (
  <Button
    aria-pressed={isActive}
    color="teal.9"
    onClick={onToggle}
    size="compact-xs"
    variant={isActive ? "filled" : "default"}
  >
    {label}
  </Button>
);
