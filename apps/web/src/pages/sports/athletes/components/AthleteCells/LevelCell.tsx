import type { FC, ReactNode } from "react";

import { Badge } from "@mantine/core";

import type { Athlete } from "../../api/types";

interface LevelCellProps {
  collegeLabel: string;
  level: Athlete["level"];
  professionalLabel: string;
}

export const LevelCell: FC<LevelCellProps> = ({
  collegeLabel,
  level,
  professionalLabel,
}): ReactNode => (
  <Badge color={level === "college" ? "blue" : "gray"} variant="light">
    {level === "college" ? collegeLabel : professionalLabel}
  </Badge>
);
