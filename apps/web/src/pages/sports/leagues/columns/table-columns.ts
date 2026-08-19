import { useLingui } from "@lingui/react/macro";
import { createElement, useMemo } from "react";

import type { LeagueTableColumn } from "./types";

import { useListFormatters } from "../../../../lib/formatting";
import { KeyAthletesCell } from "../components/LeagueCells/KeyAthletesCell";
import { LeagueIdentity } from "../components/LeagueCells/LeagueIdentity";
import { NationalitiesCell } from "../components/LeagueCells/NationalitiesCell";

export const ORDINAL_COLUMN_WIDTH = 64;
export const LEAGUE_COLUMN_WIDTH = 280;

const SCROLLING_COLUMNS_MIN_WIDTH = 500;
const KEY_ATHLETES_MIN_WIDTH = 280;
const NATIONALITIES_MIN_WIDTH = 220;

export const LEAGUE_TABLE_MIN_WIDTH =
  ORDINAL_COLUMN_WIDTH + LEAGUE_COLUMN_WIDTH + SCROLLING_COLUMNS_MIN_WIDTH;

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
        renderCell: (row) => formatters.plain.format(row.ordinal),
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
        minWidth: NATIONALITIES_MIN_WIDTH,
        renderCell: (row) =>
          createElement(NationalitiesCell, {
            nationalities: row.league.nationalities,
          }),
      },
    ],
    [formatters, t],
  );
};
