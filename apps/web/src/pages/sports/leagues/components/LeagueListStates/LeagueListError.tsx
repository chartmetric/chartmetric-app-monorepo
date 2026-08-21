import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import { Button, Center, Paper, Stack, Text, Title } from "@mantine/core";

export const LeagueListError: FC<{ retry: () => void }> = ({ retry }) => (
  <Paper p="xl" radius="md" shadow="sm">
    <Center mih={180}>
      <Stack align="center" gap="xs">
        <Title order={2} size="h3">
          <Trans comment="Error title on the leagues list page">
            Unable to load leagues
          </Trans>
        </Title>
        <Text c="dimmed">
          <Trans>The league list could not be loaded. Try again.</Trans>
        </Text>
        <Button color="red" mt="xs" onClick={retry} variant="light">
          <Trans comment="Button that retries loading the leagues list">
            Try again
          </Trans>
        </Button>
      </Stack>
    </Center>
  </Paper>
);
