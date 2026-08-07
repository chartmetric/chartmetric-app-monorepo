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
import { type FC, type ReactNode, useMemo } from "react";

import type { Athlete } from "../athlete-list-query";

export const EMPTY_CELL = "—";

export const useAthleteFormatters = (): {
  compact: Intl.NumberFormat;
  date: Intl.DateTimeFormat;
  percent: Intl.NumberFormat;
  plain: Intl.NumberFormat;
} => {
  const { i18n } = useLingui();

  return useMemo(
    () => ({
      compact: new Intl.NumberFormat(i18n.locale, {
        maximumFractionDigits: 1,
        notation: "compact",
      }),
      date: new Intl.DateTimeFormat(i18n.locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      percent: new Intl.NumberFormat(i18n.locale, {
        maximumFractionDigits: 1,
        style: "percent",
      }),
      plain: new Intl.NumberFormat(i18n.locale),
    }),
    [i18n.locale],
  );
};

export const formatCount = (
  value: number | null,
  formatter: Intl.NumberFormat,
): string => (value === null ? EMPTY_CELL : formatter.format(value));

export const formatDate = (
  value: string | null,
  formatter: Intl.DateTimeFormat,
): string | null => {
  if (value === null) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : formatter.format(parsed);
};

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
        <Group gap={4} wrap="nowrap">
          <Text fw={600} truncate>
            {athleteName}
          </Text>
          {athlete.igVerified ? (
            <Tooltip label={t`Verified on Instagram`}>
              <Text aria-label={t`Verified on Instagram`} c="blue" role="img">
                ✓
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

type SocialPlatformName = "Facebook" | "Instagram" | "TikTok" | "X" | "YouTube";

// Proper nouns, so they stay identical in every locale.
const SOCIAL_LABELS: Readonly<Record<string, SocialPlatformName>> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "X",
  youtube: "YouTube",
};

const SocialLinks: FC<AthleteIdentityProps> = ({ athlete }) => {
  const { t } = useLingui();

  if (athlete.socialLinks.length === 0) return null;

  return (
    <Group gap={6} mt={2} wrap="nowrap">
      {athlete.socialLinks.map((link) => {
        const platform = SOCIAL_LABELS[link.platform] ?? link.platform;
        const handle = link.handle;

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
            {platform}
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

// Whole words, not substrings: "cup", "showdown" and "shot" would otherwise
// decide the trend. Deriving it from a display label belongs in the contract.
const hasTerm = (label: string, terms: readonly string[]): boolean => {
  const words = new Set(label.toLocaleLowerCase().split(/[^a-z]+/u));

  return terms.some((term) => words.has(term));
};

const momentumTrend = (
  label: string | null,
  score: number | null,
): MomentumTrend => {
  const normalized = label ?? "";

  if (
    hasTerm(normalized, HOT_TERMS) ||
    (score !== null && score > MOMENTUM_HOT_THRESHOLD)
  ) {
    return "hot";
  }
  if (
    hasTerm(normalized, COLD_TERMS) ||
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
