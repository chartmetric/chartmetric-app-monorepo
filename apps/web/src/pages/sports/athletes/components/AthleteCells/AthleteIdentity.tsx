import type { FC } from "react";

import { faBadgeCheck } from "@fortawesome/pro-solid-svg-icons/faBadgeCheck";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { Avatar, Group, Stack, Text, Tooltip } from "@mantine/core";

import type { Athlete } from "../../api/types";

import { EMPTY_CELL } from "../../../../../lib/formatting";
import { CountryFlag } from "./CountryFlag";
import { SocialLinks } from "./SocialLinks";

interface AthleteIdentityProps {
  athlete: Athlete;
}

export const AthleteIdentity: FC<AthleteIdentityProps> = ({ athlete }) => {
  const { t } = useLingui();
  const athleteName =
    athlete.name ??
    t({
      comment: "Fallback name when an athlete profile has no name",
      message: "Unnamed athlete",
    });

  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar alt={athleteName} name={athleteName} src={athlete.imageUrl} />
      <Stack gap={0} miw={0}>
        <Group gap={6} wrap="nowrap">
          <CountryFlag nationality={athlete.nationality} />
          <Text fw={600} truncate>
            {athleteName}
          </Text>
          {athlete.igVerified ? (
            <Tooltip label={t`Verified on Instagram`}>
              <Text
                aria-label={t`Verified on Instagram`}
                c="blue"
                component="span"
                role="img"
              >
                <FontAwesomeIcon icon={faBadgeCheck} />
              </Text>
            </Tooltip>
          ) : null}
        </Group>
        <Text c="dimmed" size="xs">
          {athlete.sport ?? EMPTY_CELL}
        </Text>
        <SocialLinks athlete={athlete} />
      </Stack>
    </Group>
  );
};
