import type { FC } from "react";

import { Plural, useLingui } from "@lingui/react/macro";
import { Group, Text, Title } from "@mantine/core";

interface LeagueTitleProps {
  total: number | undefined;
}

export const LeagueTitle: FC<LeagueTitleProps> = ({ total }) => {
  const { t } = useLingui();

  return (
    <Group align="baseline" gap={6} miw={0}>
      <Title order={1} size="h3">
        {t`Leagues`}
      </Title>
      {total === undefined ? null : (
        <Text c="dimmed" size="sm">
          <Plural one="# league" other="# leagues" value={total} />
        </Text>
      )}
    </Group>
  );
};
