import type { FC } from "react";

import { Plural, useLingui } from "@lingui/react/macro";
import { Text, Tooltip, VisuallyHidden } from "@mantine/core";

import { CELL_TEXT_SIZE } from "./cell-typography";

// An overflow affordance summarizes; it never enumerates. Past ten entries the
// tooltip stops listing and says how many more the league holds — the full set
// belongs on a detail surface, not in a hover.
const TOOLTIP_ITEM_LIMIT = 10;
const TOOLTIP_WIDTH = 240;

interface OverflowCountProps {
  items: readonly string[];
}

export const OverflowCount: FC<OverflowCountProps> = ({ items }) => {
  const { t } = useLingui();

  if (items.length === 0) return null;

  const listed = items.slice(0, TOOLTIP_ITEM_LIMIT);
  const remaining = items.length - listed.length;
  const extra = String(items.length);
  const summary = (
    <>
      <Text component="span" display="block" size={CELL_TEXT_SIZE}>
        {listed.join(", ")}
      </Text>
      {remaining === 0 ? null : (
        <Text component="span" display="block" size={CELL_TEXT_SIZE}>
          <Plural one="…and # more" other="…and # more" value={remaining} />
        </Text>
      )}
    </>
  );

  return (
    <Tooltip label={summary} multiline w={TOOLTIP_WIDTH}>
      <Text c="dimmed" size={CELL_TEXT_SIZE} style={{ whiteSpace: "nowrap" }}>
        {t({
          comment: "Count of table-cell entries kept behind a tooltip",
          message: `+${extra}`,
        })}
        {/* A tooltip is hover-only, so the summary is read out here. */}
        <VisuallyHidden>{summary}</VisuallyHidden>
      </Text>
    </Tooltip>
  );
};
