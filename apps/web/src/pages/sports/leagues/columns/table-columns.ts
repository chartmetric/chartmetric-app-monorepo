import { useLingui } from "@lingui/react/macro";
import { createElement, useMemo } from "react";

import type { LeagueTableColumn } from "./types";

import { useListFormatters } from "../../../../lib/formatting";
import { NumericCell } from "../../numeric-cell/NumericCell";
import { CELL_TEXT_SIZE } from "../components/LeagueCells/cell-typography";
import { KeyAthletesCell } from "../components/LeagueCells/KeyAthletesCell";
import { LeagueIdentity } from "../components/LeagueCells/LeagueIdentity";
import { NationalitiesCell } from "../components/LeagueCells/NationalitiesCell";

export const ORDINAL_COLUMN_WIDTH = 64;
export const LEAGUE_COLUMN_WIDTH = 340;
export const KEY_ATHLETES_MIN_WIDTH = 288;
export const NATIONALITIES_WIDTH = 300;
export const TRACKED_ATHLETES_WIDTH = 100;
export const IG_REACH_WIDTH = 150;

export const LEAGUE_TABLE_MIN_WIDTH =
  ORDINAL_COLUMN_WIDTH +
  LEAGUE_COLUMN_WIDTH +
  KEY_ATHLETES_MIN_WIDTH +
  NATIONALITIES_WIDTH +
  TRACKED_ATHLETES_WIDTH +
  IG_REACH_WIDTH;

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
        minWidth: KEY_ATHLETES_MIN_WIDTH,
        renderCell: (row) =>
          createElement(KeyAthletesCell, { athletes: row.league.keyAthletes }),
      },
      {
        align: "left",
        key: "nationalities",
        label: t`Nationalities`,
        width: NATIONALITIES_WIDTH,
        renderCell: (row) =>
          createElement(NationalitiesCell, {
            nationalities: row.league.nationalities,
          }),
      },
      {
        align: "right",
        key: "trackedAthletes",
        label: t`Athletes`,
        renderCell: (row) =>
          createElement(NumericCell, {
            size: CELL_TEXT_SIZE,
            value: formatters.plain.format(row.league.trackedAthletes),
          }),
        sortKey: "trackedAthletes",
        width: TRACKED_ATHLETES_WIDTH,
      },
      {
        align: "right",
        key: "igReach",
        label: t`Total IG Reach`,
        renderCell: (row) =>
          createElement(NumericCell, {
            size: CELL_TEXT_SIZE,
            value: formatters.compact.format(row.league.igReach),
          }),
        sortKey: "igReach",
        tooltip: t`Sum of tracked athletes' Instagram followers — not a deduplicated audience.`,
        width: IG_REACH_WIDTH,
      },
    ],
    [formatters, t],
  );
};
