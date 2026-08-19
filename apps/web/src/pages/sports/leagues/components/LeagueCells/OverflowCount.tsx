import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Text, Tooltip, VisuallyHidden } from "@mantine/core";

interface OverflowCountProps {
  items: readonly string[];
}

export const OverflowCount: FC<OverflowCountProps> = ({ items }) => {
  const { t } = useLingui();

  if (items.length === 0) return null;

  const hidden = items.join(", ");
  const extra = String(items.length);

  return (
    <Tooltip label={hidden} multiline>
      <Text c="dimmed" size="xs" style={{ whiteSpace: "nowrap" }}>
        {t({
          comment: "Count of table-cell entries kept behind a tooltip",
          message: `+${extra}`,
        })}
        {/* A tooltip is hover-only, so the hidden entries are read out here. */}
        <VisuallyHidden>{hidden}</VisuallyHidden>
      </Text>
    </Tooltip>
  );
};
