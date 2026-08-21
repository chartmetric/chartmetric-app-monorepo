import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Avatar, Group, Text } from "@mantine/core";

interface InfluencerIdentityProps {
  name: string | null;
}

export const InfluencerIdentity: FC<InfluencerIdentityProps> = ({ name }) => {
  const { t } = useLingui();
  const displayName =
    name ??
    t({
      comment: "Fallback name when an influencer profile has no name",
      message: "Unnamed influencer",
    });

  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar alt={displayName} name={displayName} />
      <Text fw={600}>{displayName}</Text>
    </Group>
  );
};
