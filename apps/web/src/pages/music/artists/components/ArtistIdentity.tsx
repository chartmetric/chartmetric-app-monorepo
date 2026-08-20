import type { FC } from "react";

import { faBadgeCheck } from "@fortawesome/pro-regular-svg-icons/faBadgeCheck";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { Avatar, Group, Text } from "@mantine/core";

import type { Artist } from "../types";

interface ArtistIdentityProps {
  artist: Artist;
  countryName: string | null;
}

export const ArtistIdentity: FC<ArtistIdentityProps> = ({
  artist,
  countryName,
}) => {
  const { t } = useLingui();

  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar alt={artist.name} name={artist.name} src={artist.imageUrl} />
      <div>
        <Group align="center" gap={4} wrap="nowrap">
          <Text fw={600}>{artist.name}</Text>
          {artist.isVerified ? (
            <FontAwesomeIcon
              aria-label={t`Verified artist`}
              color="var(--mantine-color-blue-6)"
              icon={faBadgeCheck}
              role="img"
            />
          ) : null}
        </Group>
        {countryName === null ? null : (
          <Text c="dimmed" size="xs">
            {countryName}
          </Text>
        )}
      </div>
    </Group>
  );
};
