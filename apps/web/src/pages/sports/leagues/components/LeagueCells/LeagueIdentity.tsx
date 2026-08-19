import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Avatar, Group, Stack, Text } from "@mantine/core";

import type { League } from "../../api/types";

import { getSportColor } from "../../../sport-colors";

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
        name={leagueName}
        radius="sm"
        size={40}
        src={league.logoUrl}
      />
      <Stack gap={2} miw={0}>
        <Text fw={600} size="sm" truncate>
          {leagueName}
        </Text>
        {league.sport === null ? null : (
          <Text c={getSportColor(league.sport)} size="xs" truncate>
            {league.sport}
          </Text>
        )}
      </Stack>
    </Group>
  );
};
