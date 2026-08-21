import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import { Alert, Button, Group, Text } from "@mantine/core";

export const LeagueFilterOptionsError: FC<{ retry: () => void }> = ({
  retry,
}) => (
  <Alert
    color="red"
    title={
      <Trans comment="Error title when the leagues sport pills cannot load">
        Unable to load sports
      </Trans>
    }
  >
    <Group justify="space-between">
      <Text>
        <Trans>Filtering by sport is unavailable until this loads.</Trans>
      </Text>
      <Button color="red" onClick={retry} variant="light">
        <Trans comment="Button that retries loading the league sport filters">
          Try again
        </Trans>
      </Button>
    </Group>
  </Alert>
);
