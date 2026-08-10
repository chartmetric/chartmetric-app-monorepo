import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Anchor, Text } from "@mantine/core";

import type { Actor } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";

interface InstagramCellProps {
  actor: Actor;
}

export const InstagramCell: FC<InstagramCellProps> = ({ actor }) => {
  const { t } = useLingui();
  const { instagramHandle, instagramUrl } = actor;

  if (instagramHandle === null) return <>{EMPTY_CELL}</>;

  const handle = `@${instagramHandle.replace(/^@/u, "")}`;

  if (instagramUrl === null) {
    return (
      <Text component="span" size="sm">
        {handle}
      </Text>
    );
  }

  return (
    <Anchor
      aria-label={t({
        comment: "Accessible label for a link to an actor's Instagram profile",
        message: `Instagram profile ${handle}`,
      })}
      href={instagramUrl}
      rel="noopener noreferrer"
      size="sm"
      target="_blank"
    >
      {handle}
    </Anchor>
  );
};
