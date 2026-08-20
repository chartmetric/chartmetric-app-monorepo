import type { FC } from "react";

import { Text } from "@mantine/core";

import type { League } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";
import { CELL_TEXT_SIZE } from "./cell-typography";
import { OverflowCount } from "./OverflowCount";

const PREVIEW_COUNT = 5;

interface NationalitiesCellProps {
  nationalities: League["nationalities"];
}

export const NationalitiesCell: FC<NationalitiesCellProps> = ({
  nationalities,
}) => {
  if (nationalities.length === 0) {
    return (
      <Text c="dimmed" size={CELL_TEXT_SIZE}>
        {EMPTY_CELL}
      </Text>
    );
  }

  const preview = nationalities.slice(0, PREVIEW_COUNT);
  const overflow = nationalities.slice(PREVIEW_COUNT);

  return (
    // Mono, dimmed, wrapping up to three lines: the list does the vertical
    // work so row padding stays compact, and the +N flows inline after the
    // last entry (reference behavior).
    <Text c="dimmed" ff="monospace" lineClamp={3} miw={0} size={CELL_TEXT_SIZE}>
      {preview.join(" ")}
      {"\u{A0}"}
      <OverflowCount items={overflow} />
    </Text>
  );
};
