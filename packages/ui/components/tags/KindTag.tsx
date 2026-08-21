import type { FC, ReactNode } from "react";

import { Badge } from "@mantine/core";

import classes from "./Tags.module.css";

interface KindTagProps {
  children: ReactNode;
}

/*
 * A quiet filled tag naming what kind of thing a catalog row is (a league's
 * sport, a playlist's platform): soft wash, dark ink, no border. Colored
 * taxonomy text stays on entity rows; catalog rows describe their own kind.
 */
export const KindTag: FC<KindTagProps> = ({ children }) => (
  <Badge
    className={classes["kindTag"]}
    ff="monospace"
    fw={400}
    fz="xs"
    radius="sm"
    size="sm"
    style={{ flexShrink: 0 }}
    tt="none"
    variant="default"
  >
    {children}
  </Badge>
);
