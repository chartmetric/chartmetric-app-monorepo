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
        <Loader aria-label={t`Loading influencers`} />
        <Text c="dimmed">
          <Trans>Loading influencers…</Trans>
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
          <Trans>No influencers found</Trans>
        </Title>
        <Text c="dimmed">
          <Trans>There are no influencers to show on this page.</Trans>
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
      <Trans comment="Error title on the influencers list page">
        Unable to load influencers
      </Trans>
    }
  >
    <Stack align="flex-start" gap="sm">
      <Text>
        <Trans>The influencer list could not be loaded. Try again.</Trans>
      </Text>
      <Button color="red" onClick={retry} variant="light">
        <Trans comment="Button that retries loading the influencers list">
          Try again
        </Trans>
      </Button>
    </Stack>
  </Alert>
);

interface FilterOptionsErrorProps extends RetryProps {
  dismiss: () => void;
}

export const FilterOptionsError: FC<FilterOptionsErrorProps> = ({
  dismiss,
  retry,
}) => {
  const { t } = useLingui();

  return (
    <Alert
      closeButtonLabel={t`Dismiss filter warning`}
      color="yellow"
      onClose={dismiss}
      title={<Trans>Unable to load filter options</Trans>}
      withCloseButton
    >
      <Stack align="flex-start" gap="sm">
        <Text>
          <Trans>
            Category, country, gender and age filters are temporarily
            unavailable.
          </Trans>
        </Text>
        <Button color="yellow" onClick={retry} variant="light">
          <Trans>Retry filter options</Trans>
        </Button>
      </Stack>
    </Alert>
  );
};
