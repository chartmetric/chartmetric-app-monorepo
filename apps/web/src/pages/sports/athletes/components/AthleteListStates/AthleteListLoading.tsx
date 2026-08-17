import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Skeleton, Stack } from "@mantine/core";

export const AthleteListLoading: FC = () => {
  const { t } = useLingui();

  return (
    <Stack aria-label={t`Loading athletes`} gap={1} role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton animate height={48} key={index} radius="sm" />
      ))}
    </Stack>
  );
};
