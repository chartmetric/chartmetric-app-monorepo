import type { FC } from "react";

import { faTrophy } from "@fortawesome/pro-solid-svg-icons/faTrophy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Plural, useLingui } from "@lingui/react/macro";
import { Group, Text, Title, VisuallyHidden } from "@mantine/core";

interface LeagueTitleProps {
  total: number | undefined;
}

export const LeagueTitle: FC<LeagueTitleProps> = ({ total }) => {
  const { t } = useLingui();

  return (
    <Group align="baseline" gap={6} miw={0}>
      <FontAwesomeIcon aria-hidden icon={faTrophy} />
      <Title order={1} size="h5">
        {t`Leagues`}
      </Title>
      {total === undefined ? null : (
        <Text c="dimmed" ff="monospace" size="sm">
          {total}
          <VisuallyHidden>
            <Plural one="league" other="leagues" value={total} />
          </VisuallyHidden>
        </Text>
      )}
    </Group>
  );
};
