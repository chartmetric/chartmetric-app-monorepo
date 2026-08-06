import { useLingui } from "@lingui/react/macro";
import { createElement, useMemo } from "react";

import type { AthleteCellRenderers, AthleteColumnKey } from "./types";

import {
  EMPTY_CELL,
  formatCount,
  formatDate,
  useListFormatters,
} from "../../../../lib/formatting";
import {
  ClubCell,
  GpsCell,
  LeagueCell,
  LevelCell,
  MomentumCell,
} from "../components/AthleteCells";

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
          : formatters.plain.format(athlete.age),
      club: (athlete) => createElement(ClubCell, { athlete }),
      gpsScore: (athlete) =>
        createElement(GpsCell, { score: athlete.gpsScore }),
      igEngagementRate: (athlete) =>
        athlete.igEngagementRate === null
          ? EMPTY_CELL
          : formatters.percent.format(athlete.igEngagementRate),
      igFollowers: (athlete) =>
        formatCount(athlete.igFollowers, formatters.compact),
      igPosts: (athlete) => formatCount(athlete.igPosts, formatters.plain),
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
        formatCount(athlete.tiktokFollowers, formatters.compact),
      tiktokHearts: (athlete) =>
        formatCount(athlete.tiktokHearts, formatters.compact),
      tiktokLikes: (athlete) =>
        formatCount(athlete.tiktokLikes, formatters.compact),
      tiktokPosts: (athlete) =>
        formatCount(athlete.tiktokPosts, formatters.plain),
      tiktokVideos: (athlete) =>
        formatCount(athlete.tiktokVideos, formatters.plain),
    };
  }, [formatters, t]);
};
