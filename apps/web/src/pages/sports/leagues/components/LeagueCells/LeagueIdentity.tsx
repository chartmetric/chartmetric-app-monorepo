import type { FC } from "react";

import { faTrophy } from "@fortawesome/pro-solid-svg-icons/faTrophy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { Avatar, Badge, Group, Text } from "@mantine/core";

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
        size={36}
        src={league.logoUrl}
      >
        <FontAwesomeIcon aria-hidden icon={faTrophy} />
      </Avatar>
      {/* Catalog rows tag the sport as a quiet neutral chip beside the name;
          colored sport text stays on entity rows (athletes), where the sport
          classifies a person rather than the row's own kind. */}
      <Group gap={8} miw={0} wrap="nowrap">
        <Text fw={600} size="sm" truncate>
          {leagueName}
        </Text>
        {league.sport === null ? null : (
          <Badge
            c="dimmed"
            ff="monospace"
            fw={400}
            radius="sm"
            size="sm"
            style={{ flexShrink: 0 }}
            tt="none"
            variant="default"
          >
            {toSportLabel(league.sport)}
          </Badge>
        )}
      </Group>
    </Group>
  );
};
