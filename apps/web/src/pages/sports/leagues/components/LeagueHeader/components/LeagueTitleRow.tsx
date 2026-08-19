import type { FC } from "react";

import { Plural, useLingui } from "@lingui/react/macro";
import { Group, Text, Title } from "@mantine/core";
import { SearchInput } from "@repo/ui/search-input";

interface LeagueTitleRowProps {
  name: string;
  onNameChange: (name: string) => void;
  total: number | undefined;
}

export const LeagueTitleRow: FC<LeagueTitleRowProps> = ({
  name,
  onNameChange,
  total,
}) => {
  const { t } = useLingui();

  return (
    <Group align="center" gap="sm" justify="space-between">
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
      <SearchInput
        label={t`Search by league name`}
        name="league-search"
        onChange={onNameChange}
        placeholder={t`Search leagues…`}
        value={name}
      />
    </Group>
  );
};
