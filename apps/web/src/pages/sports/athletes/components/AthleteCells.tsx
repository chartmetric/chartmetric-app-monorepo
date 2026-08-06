import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { FC, ReactNode } from "react";

import { faFacebookF } from "@fortawesome/free-brands-svg-icons/faFacebookF";
import { faInstagram } from "@fortawesome/free-brands-svg-icons/faInstagram";
import { faTiktok } from "@fortawesome/free-brands-svg-icons/faTiktok";
import { faXTwitter } from "@fortawesome/free-brands-svg-icons/faXTwitter";
import { faYoutube } from "@fortawesome/free-brands-svg-icons/faYoutube";
import { faBadgeCheck } from "@fortawesome/pro-solid-svg-icons/faBadgeCheck";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import {
  Anchor,
  Avatar,
  Badge,
  Group,
  Image,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";

import type { Athlete } from "../api/types";

import { toCountryFlag } from "../../../../lib/country-flags";
import { EMPTY_CELL } from "../../../../lib/formatting";

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

interface CountryFlagProps {
  nationality: string | null;
}

const CountryFlag: FC<CountryFlagProps> = ({ nationality }) => {
  const flag = toCountryFlag(nationality);

  if (flag === null || nationality === null) return null;

  return (
    <Tooltip label={nationality}>
      <Text aria-label={nationality} component="span" role="img" size="sm">
        {flag}
      </Text>
    </Tooltip>
  );
};

type SocialPlatformName = "Facebook" | "Instagram" | "TikTok" | "X" | "YouTube";

// Proper nouns, so they stay identical in every locale.
const SOCIAL_LABELS: Readonly<Record<string, SocialPlatformName>> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "X",
  youtube: "YouTube",
};

const SOCIAL_ICONS: Readonly<Record<string, IconDefinition>> = {
  facebook: faFacebookF,
  instagram: faInstagram,
  tiktok: faTiktok,
  twitter: faXTwitter,
  youtube: faYoutube,
};

const SocialLinks: FC<AthleteIdentityProps> = ({ athlete }) => {
  const { t } = useLingui();

  if (athlete.socialLinks.length === 0) return null;

  return (
    <Group gap={6} mt={2} wrap="nowrap">
      {athlete.socialLinks.map((link) => {
        const platform = SOCIAL_LABELS[link.platform] ?? link.platform;
        const handle = link.handle;
        const icon = SOCIAL_ICONS[link.platform];

        return (
          <Anchor
            aria-label={t({
              comment: "Link to an athlete's social profile",
              message: `${platform} profile ${handle}`,
            })}
            c="dimmed"
            href={link.url}
            key={link.platform}
            rel="noopener noreferrer"
            size="xs"
            target="_blank"
          >
            {icon === undefined ? platform : <FontAwesomeIcon icon={icon} />}
          </Anchor>
        );
      })}
    </Group>
  );
};

interface ClubCellProps {
  athlete: Athlete;
}

export const ClubCell: FC<ClubCellProps> = ({ athlete }) => {
  if (athlete.club === null) return <Text c="dimmed">{EMPTY_CELL}</Text>;

  return (
    <Group gap={6} wrap="nowrap">
      {athlete.teamLogoUrl === null ? null : (
        <Image alt="" h={16} src={athlete.teamLogoUrl} w={16} />
      )}
      <Text size="sm" truncate>
        {athlete.club}
      </Text>
    </Group>
  );
};

interface LeagueCellProps {
  athlete: Athlete;
  moreLabel: (count: number) => string;
}

export const LeagueCell: FC<LeagueCellProps> = ({ athlete, moreLabel }) => {
  const [primary, ...rest] = athlete.leagues;

  if (primary === undefined) return <Text c="dimmed">{EMPTY_CELL}</Text>;

  return (
    <Stack gap={0} miw={0}>
      <Tooltip
        disabled={rest.length === 0}
        label={athlete.leagues.join(", ")}
        multiline
      >
        <Text size="sm" truncate>
          {primary}
        </Text>
      </Tooltip>
      {rest.length === 0 ? null : (
        <Text c="dimmed" size="xs">
          {moreLabel(rest.length)}
        </Text>
      )}
    </Stack>
  );
};

interface GpsCellProps {
  score: number | null;
}

// The thresholds mirror the upstream dashboard's banding so a score keeps the
// same colour across products.
const gpsColor = (score: number): string => {
  if (score >= 75) return "teal";

  return score >= 50 ? "yellow" : "red";
};

export const GpsCell: FC<GpsCellProps> = ({ score }) =>
  score === null ? (
    <Text c="dimmed">{EMPTY_CELL}</Text>
  ) : (
    <Badge color={gpsColor(score)} variant="light">
      {Math.round(score)}
    </Badge>
  );

interface MomentumCellProps {
  label: string | null;
  score: number | null;
  steadyLabel: string;
}

const HOT_TERMS = ["hot", "fire", "rising", "up"];
const COLD_TERMS = ["cold", "falling", "down"];
const MOMENTUM_HOT_THRESHOLD = 15;

type MomentumTrend = "cold" | "hot" | "steady";

const MOMENTUM_COLORS: Readonly<Record<MomentumTrend, string>> = {
  cold: "blue",
  hot: "orange",
  steady: "gray",
};

const MOMENTUM_INDICATORS: Readonly<Record<MomentumTrend, string>> = {
  cold: "▼",
  hot: "▲",
  steady: "—",
};

const momentumTrend = (
  label: string | null,
  score: number | null,
): MomentumTrend => {
  const normalized = (label ?? "").toLocaleLowerCase();

  if (
    HOT_TERMS.some((term) => normalized.includes(term)) ||
    (score !== null && score > MOMENTUM_HOT_THRESHOLD)
  ) {
    return "hot";
  }
  if (
    COLD_TERMS.some((term) => normalized.includes(term)) ||
    (score !== null && score < -MOMENTUM_HOT_THRESHOLD)
  ) {
    return "cold";
  }

  return "steady";
};

export const MomentumCell: FC<MomentumCellProps> = ({
  label,
  score,
  steadyLabel,
}) => {
  if (score === null && label === null)
    return <Text c="dimmed">{EMPTY_CELL}</Text>;

  const trend = momentumTrend(label, score);
  const color = MOMENTUM_COLORS[trend];
  const indicator = MOMENTUM_INDICATORS[trend];

  return (
    <Badge color={color} variant="light">
      <Group component="span" gap={4} wrap="nowrap">
        <span aria-hidden="true">{indicator}</span>
        {label ?? steadyLabel}
      </Group>
    </Badge>
  );
};

interface LevelCellProps {
  collegeLabel: string;
  level: Athlete["level"];
  professionalLabel: string;
}

export const LevelCell: FC<LevelCellProps> = ({
  collegeLabel,
  level,
  professionalLabel,
}): ReactNode => (
  <Badge color={level === "college" ? "blue" : "gray"} variant="light">
    {level === "college" ? collegeLabel : professionalLabel}
  </Badge>
);
