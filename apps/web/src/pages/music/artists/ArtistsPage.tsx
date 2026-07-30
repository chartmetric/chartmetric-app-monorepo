import type { FC } from "react";

import { Trans } from "@lingui/react/macro";
import { Title } from "@mantine/core";

export const ArtistsPage: FC = () => (
  <Title order={1}>
    <Trans>This is the Artists page</Trans>
  </Title>
);
