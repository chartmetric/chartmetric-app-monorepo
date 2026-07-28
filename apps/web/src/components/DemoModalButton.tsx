import type { FC } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { modals } from "@mantine/modals";

import { AddArtistForm } from "./AddArtistForm";

export const DemoModalButton: FC = () => {
  const { t } = useLingui();

  return (
    <Button
      onClick={() => {
        modals.open({ children: <AddArtistForm />, title: t`Add artist` });
      }}
      variant="light"
    >
      <Trans>Open modal</Trans>
    </Button>
  );
};
