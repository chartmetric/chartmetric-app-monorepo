import type { FC } from "react";

import { faTrophy } from "@fortawesome/pro-regular-svg-icons/faTrophy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { Avatar, Group } from "@mantine/core";
import { CellText } from "@repo/ui/cell-text";
import { KindTag } from "@repo/ui/kind-tag";

import type { League } from "../../api/types";

import { toSportLabel } from "../../../sport-labels";

interface LeagueIdentityProps {
  league: League;
}

export const LeagueIdentity: FC<LeagueIdentityProps> = ({ league }) => {
  const { t } = useLingui();
  const leagueName =
    league.name ??
    t({
      comment: "Fallback name when a league record has no name",
      message: "Unnamed league",
    });

  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar
        alt={leagueName}
        bd="1px solid var(--mantine-color-default-border)"
        radius="sm"
        size={28}
        src={league.logoUrl}
      >
        <FontAwesomeIcon aria-hidden icon={faTrophy} />
      </Avatar>
      <Group gap={8} miw={0} wrap="nowrap">
        <CellText ff="monospace" fw={500} size="sm" truncate>
          {leagueName}
        </CellText>
        {league.sport === null ? null : (
          <KindTag>{toSportLabel(league.sport)}</KindTag>
        )}
      </Group>
    </Group>
  );
};
