import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import { Alert, Button, Stack, Text } from "@mantine/core";

interface ActorListErrorProps {
  retry: () => void;
}

export const ActorListError: FC<ActorListErrorProps> = ({ retry }) => (
  <Alert
    color="red"
    title={
      <Trans comment="Error title on the actors list page">
        Unable to load actors
      </Trans>
    }
  >
    <Stack align="flex-start" gap="sm">
      <Text>
        <Trans>The actor list could not be loaded. Try again.</Trans>
      </Text>
      <Button color="red" onClick={retry} variant="light">
        <Trans comment="Button that retries loading the actors list">
          Try again
        </Trans>
      </Button>
    </Stack>
  </Alert>
);
