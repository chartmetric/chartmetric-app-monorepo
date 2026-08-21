import { useLingui } from "@lingui/react/macro";
import { CELL_TEXT_SIZE } from "@repo/ui/cell-text";
import { NumericCell } from "@repo/ui/numeric-cell";
import { createElement, type ReactElement, useMemo } from "react";

import type { AthleteCellRenderers, AthleteColumnKey } from "./types";

import {
  EMPTY_CELL,
  formatCount,
  formatDate,
  useListFormatters,
} from "../../../../lib/formatting";
import { ClubCell } from "../components/AthleteCells/ClubCell";
import { GpsCell } from "../components/AthleteCells/GpsCell";
import { LeagueCell } from "../components/AthleteCells/LeagueCell";
import { LevelCell } from "../components/AthleteCells/LevelCell";
import { MomentumCell } from "../components/AthleteCells/MomentumCell";

export const useAthleteColumnHeadings = (): Record<
  AthleteColumnKey,
  string
> => {
  const { t } = useLingui();

  return useMemo(
    () => ({
      age: t`Age`,
      club: t`Team`,
      gpsScore: t`GPS`,
      igEngagementRate: t`Engagement`,
      igFollowers: t`Followers`,
      igPosts: t`Posts`,
      lastMatchDate: t`Last game`,
      league: t`League`,
      level: t`Level`,
      momentum: t`Momentum`,
      nationality: t`Nationality`,
      position: t`Pos`,
      tiktokFollowers: t`Followers`,
      tiktokHearts: t`Hearts`,
      tiktokLikes: t`Likes`,
      tiktokPosts: t`Posts`,
      tiktokVideos: t`Videos`,
    }),
    [t],
  );
};

export const useAthleteCellRenderers = (): AthleteCellRenderers => {
  const { t } = useLingui();
  const formatters = useListFormatters();

  return useMemo(() => {
    const numeric = (value: string): ReactElement =>
      createElement(NumericCell, { size: CELL_TEXT_SIZE, value });
    const moreLabel = (count: number): string => {
      const extra = String(count);

      return t({
        comment: "Count of additional leagues an athlete competes in",
        message: `+${extra} more`,
      });
    };

    return {
      age: (athlete) =>
        athlete.age === null
          ? EMPTY_CELL
          : numeric(formatters.plain.format(athlete.age)),
      club: (athlete) => createElement(ClubCell, { athlete }),
      gpsScore: (athlete) =>
        createElement(GpsCell, { score: athlete.gpsScore }),
      igEngagementRate: (athlete) =>
        athlete.igEngagementRate === null
          ? EMPTY_CELL
          : numeric(formatters.percent.format(athlete.igEngagementRate)),
      igFollowers: (athlete) =>
        numeric(formatCount(athlete.igFollowers, formatters.compact)),
      igPosts: (athlete) =>
        numeric(formatCount(athlete.igPosts, formatters.plain)),
      lastMatchDate: (athlete) =>
        formatDate(athlete.lastMatchDate, formatters.date),
      league: (athlete) => createElement(LeagueCell, { athlete, moreLabel }),
      level: (athlete) =>
        createElement(LevelCell, {
          collegeLabel: t`College`,
          level: athlete.level,
          professionalLabel: t`Pro`,
        }),
      momentum: (athlete) =>
        createElement(MomentumCell, {
          label: athlete.momentumLabel,
          score: athlete.momentumScore,
          steadyLabel: t`Steady`,
        }),
      nationality: (athlete) => athlete.nationality ?? EMPTY_CELL,
      position: (athlete) => athlete.position ?? EMPTY_CELL,
      tiktokFollowers: (athlete) =>
        numeric(formatCount(athlete.tiktokFollowers, formatters.compact)),
      tiktokHearts: (athlete) =>
        numeric(formatCount(athlete.tiktokHearts, formatters.compact)),
      tiktokLikes: (athlete) =>
        numeric(formatCount(athlete.tiktokLikes, formatters.compact)),
      tiktokPosts: (athlete) =>
        numeric(formatCount(athlete.tiktokPosts, formatters.plain)),
      tiktokVideos: (athlete) =>
        numeric(formatCount(athlete.tiktokVideos, formatters.plain)),
    };
  }, [formatters, t]);
};
