import type { FC } from "react";

import { Anchor, Avatar, Group } from "@mantine/core";
import { Link } from "react-router";

import type { Actor } from "../../api/types";

interface ActorIdentityProps {
  actor: Actor;
}

export const ActorIdentity: FC<ActorIdentityProps> = ({ actor }) => (
  <Group gap="sm" wrap="nowrap">
    <Avatar alt={actor.name} name={actor.name} src={actor.imageUrl} />
    {/* Deliberately not truncated: under `table-layout: auto` a nowrap cell
        widens its own column instead of clipping. */}
    <Anchor
      component={Link}
      fw={600}
      size="sm"
      to={`/tv/actors/${String(actor.id)}`}
    >
      {actor.name}
    </Anchor>
  </Group>
);
