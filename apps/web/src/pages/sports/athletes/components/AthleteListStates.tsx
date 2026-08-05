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

export const AthleteListLoading: FC = () => {
  const { t } = useLingui();

  return (
    <Center mih={280}>
      <Stack align="center" gap="sm" role="status">
        <Loader aria-label={t`Loading athletes`} />
        <Text c="dimmed">
          <Trans>Loading athletes…</Trans>
        </Text>
      </Stack>
    </Center>
  );
};

export const AthleteListEmpty: FC = () => (
  <Paper p="xl" radius="md" withBorder>
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

interface RetryProps {
  retry: () => void;
}

export const AthleteListError: FC<RetryProps> = ({ retry }) => (
  <Alert
    color="red"
    title={
      <Trans comment="Error title on the athletes list page">
        Unable to load athletes
      </Trans>
    }
  >
    <Stack align="flex-start" gap="sm">
      <Text>
        <Trans>The athlete list could not be loaded. Try again.</Trans>
      </Text>
      <Button color="red" onClick={retry} variant="light">
        <Trans comment="Button that retries loading the athletes list">
          Try again
        </Trans>
      </Button>
    </Stack>
  </Alert>
);

export const AthleteFilterOptionsError: FC<RetryProps> = ({ retry }) => (
  <Alert color="yellow" title={<Trans>Unable to load filter options</Trans>}>
    <Stack align="flex-start" gap="sm">
      <Text>
        <Trans>Category filters are temporarily unavailable.</Trans>
      </Text>
      <Button color="yellow" onClick={retry} variant="light">
        <Trans>Retry filter options</Trans>
      </Button>
    </Stack>
  </Alert>
);
