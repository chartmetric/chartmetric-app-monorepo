import type { FC } from "react";

import { CellText } from "@repo/ui/cell-text";

import type { League } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";
import { OverflowCount } from "./OverflowCount";

const PREVIEW_COUNT = 5;

interface NationalitiesCellProps {
  nationalities: League["nationalities"];
}

export const NationalitiesCell: FC<NationalitiesCellProps> = ({
  nationalities,
}) => {
  if (nationalities.length === 0) {
    return <CellText c="dimmed">{EMPTY_CELL}</CellText>;
  }

  const preview = nationalities.slice(0, PREVIEW_COUNT);
  const overflow = nationalities.slice(PREVIEW_COUNT);

  return (
    <CellText c="dimmed" ff="monospace" lineClamp={3} miw={0}>
      {preview.map((name) => name.replaceAll(" ", "\u{A0}")).join(" ")}
      {"\u{A0}"}
      <OverflowCount items={overflow} />
    </CellText>
  );
};
