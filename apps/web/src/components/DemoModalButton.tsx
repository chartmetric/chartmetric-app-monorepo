import type { FC } from "react";

import { Button } from "@mantine/core";
import { modals } from "@mantine/modals";

import { AddArtistForm } from "./AddArtistForm";

export const DemoModalButton: FC = () => (
  <Button
    onClick={() => {
      modals.open({ children: <AddArtistForm />, title: "Add artist" });
    }}
    variant="light"
  >
    Open modal
  </Button>
);
