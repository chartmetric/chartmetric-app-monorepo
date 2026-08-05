import type { DataTableColumn } from "@repo/ui/data-table";

import { useLingui } from "@lingui/react/macro";
import { createElement, useMemo } from "react";

import type { Athlete, AthleteSortBy } from "./athlete-list-query";

import { ATHLETE_COLUMNS, type AthleteColumnKey } from "./athlete-columns";
import {
  AthleteIdentity,
  EMPTY_CELL,
  useAthleteFormatters,
} from "./components/AthleteCells";
import {
  useAthleteCellRenderers,
  useAthleteColumnHeadings,
} from "./use-athlete-column-cells";

export const RANK_COLUMN_WIDTH = 64;
export const ATHLETE_COLUMN_WIDTH = 240;

export type AthleteTableColumn = DataTableColumn<Athlete, AthleteSortBy>;

export const useAthleteTableColumns = (
  visibleColumns: readonly AthleteColumnKey[],
): AthleteTableColumn[] => {
  const { t } = useLingui();
  const headings = useAthleteColumnHeadings();
  const renderers = useAthleteCellRenderers();
  const formatters = useAthleteFormatters();

  return useMemo(() => {
    const pinned: AthleteTableColumn[] = [
      {
        align: "left",
        key: "rank",
        label: t`Rank`,
        renderCell: (athlete) =>
          athlete.rank === null
            ? EMPTY_CELL
            : formatters.plain.format(athlete.rank),
        sortKey: "rank",
        sticky: true,
        width: RANK_COLUMN_WIDTH,
      },
      {
        align: "left",
        key: "athlete",
        label: t`Athlete`,
        renderCell: (athlete) => createElement(AthleteIdentity, { athlete }),
        sortKey: "name",
        sticky: true,
        width: ATHLETE_COLUMN_WIDTH,
      },
    ];
    const selected = visibleColumns.flatMap<AthleteTableColumn>((key) => {
      const definition = ATHLETE_COLUMNS.find(
        (candidate) => candidate.key === key,
      );

      if (definition === undefined) return [];

      // Instagram and TikTok both contribute a "Followers" and a "Posts"
      // column, so the platform sits above the metric name in the header.
      const isPlatformColumn =
        definition.source === "Instagram" || definition.source === "TikTok";

      return [
        {
          align: definition.align,
          key: definition.key,
          label: headings[definition.key],
          minWidth: definition.minWidth,
          renderCell: renderers[definition.key],
          ...(isPlatformColumn && { secondaryLabel: definition.source }),
          ...(definition.sortKey !== undefined && {
            sortKey: definition.sortKey,
          }),
        },
      ];
    });

    return [...pinned, ...selected];
  }, [formatters, headings, renderers, t, visibleColumns]);
};
