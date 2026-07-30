import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import { Title } from "@mantine/core";

export const AthletesPage: FC = () => (
  <Title order={1}>
    <Trans>This is the Athletes page</Trans>
  </Title>
);
