import type { FC } from "react";

import { faBadgeCheck } from "@fortawesome/pro-regular-svg-icons/faBadgeCheck";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { Avatar, Group, Stack, Text, Tooltip } from "@mantine/core";
import { CellText } from "@repo/ui/cell-text";

import type { Athlete } from "../../api/types";

import { getSportColor } from "../../../sport-colors";
import { toSportLabel } from "../../../sport-labels";
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
      <Avatar
        alt={athleteName}
        bd="1px solid var(--mantine-color-default-border)"
        name={athleteName}
        radius="50%"
        size={40}
        src={athlete.imageUrl}
      />
      <Stack gap={2} miw={0}>
        <Group gap={6} wrap="nowrap">
          <CellText fw={600} size="sm" truncate>
            {athleteName}
          </CellText>
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
        <Group align="center" gap={4} wrap="nowrap">
          <CountryFlag nationality={athlete.nationality} />
          {athlete.sport !== null && (
            <Text c={getSportColor(athlete.sport)} size="xs" truncate>
              {toSportLabel(athlete.sport)}
            </Text>
          )}
        </Group>
        <SocialLinks athlete={athlete} />
      </Stack>
    </Group>
  );
};
