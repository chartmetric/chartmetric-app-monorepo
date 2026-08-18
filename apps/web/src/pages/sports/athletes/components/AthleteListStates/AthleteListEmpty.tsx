import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import { Center, Paper, Stack, Text, Title } from "@mantine/core";

export const AthleteListEmpty: FC = () => (
  <Paper p="xl" radius="md" shadow="sm">
    <Center mih={180}>
      <Stack align="center" gap="xs">
        <Title order={2} size="h3">
          <Trans>No athletes found</Trans>
        </Title>
        <Text c="dimmed">
          <Trans>Try widening your filters or clearing the search.</Trans>
        </Text>
      </Stack>
    </Center>
  </Paper>
);
