import type { FC } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import {
  Alert,
  Button,
  Center,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";

export const LoadingState: FC = () => {
  const { t } = useLingui();

  return (
    <Center mih={280}>
      <Stack align="center" gap="sm" role="status">
        <Loader aria-label={t`Loading artists`} />
        <Text c="dimmed">
          <Trans>Loading artists…</Trans>
        </Text>
      </Stack>
    </Center>
  );
};

export const EmptyState: FC = () => (
  <Paper p="xl" radius="md" withBorder>
    <Center mih={180}>
      <Stack align="center" gap="xs">
        <Title order={2} size="h3">
          <Trans>No artists found</Trans>
        </Title>
        <Text c="dimmed">
          <Trans>There are no artists to show on this page.</Trans>
        </Text>
      </Stack>
    </Center>
  </Paper>
);

interface RetryProps {
  retry: () => void;
}

export const ErrorState: FC<RetryProps> = ({ retry }) => (
  <Alert
    color="red"
    title={
      <Trans comment="Error title on the artists list page">
        Unable to load artists
      </Trans>
    }
  >
    <Stack align="flex-start" gap="sm">
      <Text>
        <Trans>The artist list could not be loaded. Try again.</Trans>
      </Text>
      <Button color="red" onClick={retry} variant="light">
        <Trans comment="Button that retries loading the artists list">
          Try again
        </Trans>
      </Button>
    </Stack>
  </Alert>
);

export const FilterOptionsError: FC<RetryProps> = ({ retry }) => (
  <Alert color="yellow" title={<Trans>Unable to load filter options</Trans>}>
    <Stack align="flex-start" gap="sm">
      <Text>
        <Trans>Country and genre filters are temporarily unavailable.</Trans>
      </Text>
      <Button color="yellow" onClick={retry} variant="light">
        <Trans>Retry filter options</Trans>
      </Button>
    </Stack>
  </Alert>
);
