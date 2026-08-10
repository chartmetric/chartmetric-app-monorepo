import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Anchor, Stack } from "@mantine/core";
import { Link } from "react-router";

import type { Actor, KnownForCredit } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";

interface KnownForCellProps {
  actor: Actor;
}

// A movie and a show can share a title id, so the id alone is not unique.
const creditKey = (credit: KnownForCredit): string =>
  `${String(credit.id)}-${credit.kind}-${credit.character}`;

export const KnownForCell: FC<KnownForCellProps> = ({ actor }) => {
  const { t } = useLingui();

  if (actor.knownFor.length === 0) return <>{EMPTY_CELL}</>;

  const creditLabel = (credit: KnownForCredit): string => {
    const character = credit.character.trim();
    const title = credit.name;

    if (character === "") return title;

    return t({
      comment: "A known-for acting credit: the title and the character played",
      message: `${title} as ${character}`,
    });
  };

  return (
    <Stack gap={2}>
      {actor.knownFor.map((credit) => (
        <Anchor
          component={Link}
          key={creditKey(credit)}
          size="sm"
          to={`/tv/titles/${String(credit.id)}`}
        >
          {creditLabel(credit)}
        </Anchor>
      ))}
    </Stack>
  );
};
