import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import { Alert, Button, Stack, Text } from "@mantine/core";

export const AthleteListError: FC<{ retry: () => void }> = ({ retry }) => (
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
