import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Anchor, Stack } from "@mantine/core";
import { Link } from "react-router";

import type { Actor, KnownForCredit } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";

interface KnownForCellProps {
  actor: Actor;
}

const creditKey = (credit: KnownForCredit): string =>
  `${String(credit.id)}-${credit.kind}-${credit.character ?? ""}`;

export const KnownForCell: FC<KnownForCellProps> = ({ actor }) => {
  const { t } = useLingui();

  if (actor.knownFor.length === 0) return <>{EMPTY_CELL}</>;

  const creditLabel = (credit: KnownForCredit): string => {
    const title =
      credit.network === null
        ? credit.name
        : `${credit.name} ${credit.network}`;

    if (credit.character === null) return title;
    const character = credit.character;

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
