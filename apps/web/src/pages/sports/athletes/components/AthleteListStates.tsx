import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import { Alert, Button, Stack, Text } from "@mantine/core";

export const AthleteFilterOptionsError: FC<{ retry: () => void }> = ({
  retry,
}) => (
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
