import type { FC } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import { Center, Loader, Stack, Text } from "@mantine/core";

export const ActorListLoading: FC = () => {
  const { t } = useLingui();

  return (
    <Center mih={280}>
      <Stack align="center" gap="sm" role="status">
        <Loader aria-label={t`Loading actors`} />
        <Text c="dimmed">
          <Trans>Loading actors…</Trans>
        </Text>
      </Stack>
    </Center>
  );
};
