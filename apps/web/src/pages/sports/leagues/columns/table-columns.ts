import { faUserGroup } from "@fortawesome/pro-regular-svg-icons/faUserGroup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { CELL_TEXT_SIZE } from "@repo/ui/cell-text";
import { NumericCell } from "@repo/ui/numeric-cell";
import { createElement, useMemo } from "react";

import type { LeagueTableColumn } from "./types";

import { useListFormatters } from "../../../../lib/formatting";
import { KeyAthletesCell } from "../components/LeagueCells/KeyAthletesCell";
import { LeagueIdentity } from "../components/LeagueCells/LeagueIdentity";
import { NationalitiesCell } from "../components/LeagueCells/NationalitiesCell";

const METRIC_TEXT_SIZE = "xs";

export const ORDINAL_COLUMN_WIDTH = 36;
export const LEAGUE_COLUMN_WIDTH = 290;
export const KEY_ATHLETES_WIDTH = 400;
export const NATIONALITIES_MIN_WIDTH = 185;
export const TRACKED_ATHLETES_WIDTH = 80;
export const IG_REACH_WIDTH = 150;

export const LEAGUE_TABLE_MIN_WIDTH =
  ORDINAL_COLUMN_WIDTH +
  LEAGUE_COLUMN_WIDTH +
  KEY_ATHLETES_WIDTH +
  NATIONALITIES_MIN_WIDTH +
  TRACKED_ATHLETES_WIDTH +
  IG_REACH_WIDTH;

interface MetricLabels {
  athletes: string;
  igReach: string;
  igReachTooltip: string;
}

// The Lingui macro only transforms t\`…\` bound to useLingui's own identifier,
// so labels resolve in the hook and arrive here as plain strings.
const metricColumns = (
  labels: MetricLabels,
  formatters: ReturnType<typeof useListFormatters>,
): LeagueTableColumn[] => [
  {
    align: "right",
    key: "trackedAthletes",
    label: labels.athletes,
    renderCell: (row) =>
      createElement(NumericCell, {
        icon: createElement(FontAwesomeIcon, {
          color:
            "light-dark(var(--mantine-color-gray-7),var(--mantine-color-dark-2))",
          icon: faUserGroup,
        }),
        size: METRIC_TEXT_SIZE,
        value: formatters.plain.format(row.league.trackedAthletes),
      }),
    sortKey: "trackedAthletes",
    width: TRACKED_ATHLETES_WIDTH,
  },
  {
    align: "right",
    key: "igReach",
    label: labels.igReach,
    renderCell: (row) =>
      createElement(NumericCell, {
        size: METRIC_TEXT_SIZE,
        value: formatters.compact.format(row.league.igReach),
      }),
    sortKey: "igReach",
    tooltip: labels.igReachTooltip,
    width: IG_REACH_WIDTH,
  },
];

export const useLeagueTableColumns = (): LeagueTableColumn[] => {
  const { t } = useLingui();
  const formatters = useListFormatters();

  return useMemo(
    () => [
      {
        align: "left",
        key: "ordinal",
        label: t({
          comment: "Leagues table column heading for the row number",
          message: "#",
        }),
        renderCell: (row) =>
          createElement(NumericCell, {
            muted: true,
            size: CELL_TEXT_SIZE,
            value: formatters.plain.format(row.ordinal),
          }),
        sticky: true,
        width: ORDINAL_COLUMN_WIDTH,
      },
      {
        align: "left",
        key: "league",
        label: t`League / Competition`,
        renderCell: (row) =>
          createElement(LeagueIdentity, { league: row.league }),
        sortKey: "name",
        sticky: true,
        width: LEAGUE_COLUMN_WIDTH,
      },
      {
        align: "left",
        key: "keyAthletes",
        label: t`Key Athletes`,
        width: KEY_ATHLETES_WIDTH,
        renderCell: (row) =>
          createElement(KeyAthletesCell, { athletes: row.league.keyAthletes }),
      },
      {
        align: "left",
        key: "nationalities",
        label: t`Nationalities`,
        minWidth: NATIONALITIES_MIN_WIDTH,
        renderCell: (row) =>
          createElement(NationalitiesCell, {
            nationalities: row.league.nationalities,
          }),
      },
      ...metricColumns(
        {
          athletes: t`Athletes`,
          igReach: t`Total IG Reach`,
          igReachTooltip: t`Sum of tracked athletes' Instagram followers — not a deduplicated audience.`,
        },
        formatters,
      ),
    ],
    [formatters, t],
  );
};
