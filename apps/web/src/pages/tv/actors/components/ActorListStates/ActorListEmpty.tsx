import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import { Center, Paper, Stack, Text, Title } from "@mantine/core";

export const ActorListEmpty: FC = () => (
  <Paper p="xl" radius="md" withBorder>
    <Center mih={180}>
      <Stack align="center" gap="xs">
        <Title order={2} size="h3">
          <Trans>No actors found</Trans>
        </Title>
        <Text c="dimmed">
          <Trans>There are no actors to show on this page.</Trans>
        </Text>
      </Stack>
    </Center>
  </Paper>
);
