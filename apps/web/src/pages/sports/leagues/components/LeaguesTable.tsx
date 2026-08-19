import type { FC } from "react";

import { faArrowDown } from "@fortawesome/pro-solid-svg-icons/faArrowDown";
import { faArrowUp } from "@fortawesome/pro-solid-svg-icons/faArrowUp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { Group, Paper, Text } from "@mantine/core";
import { DataTable, type DataTableSortDirection } from "@repo/ui/data-table";
import { TablePagination } from "@repo/ui/table-pagination";

import type { League, LeagueSortBy } from "../api/types";

import { useListFormatters } from "../../../../lib/formatting";
import { LEAGUE_PAGE_SIZE } from "../api/league-list";
import {
  LEAGUE_TABLE_MIN_WIDTH,
  useLeagueTableColumns,
} from "../columns/table-columns";
import { SkeletonDataRow } from "./LeagueListStates/LeagueListLoading";

// Teal hover: product accent instead of Mantine's default gray.
const TEAL_HOVER_STYLE = {
  "--table-highlight-on-hover-color": "var(--mantine-color-teal-light)",
} as const;

interface LeagueTableToolbarProps {
  columnLabel: string;
  direction: DataTableSortDirection;
}

const LeagueTableToolbar: FC<LeagueTableToolbarProps> = ({
  columnLabel,
  direction,
}) => {
  const { t } = useLingui();

  return (
    <Group justify="space-between" px="md" py="xs">
      <Group c="dimmed" gap={6}>
        <Text size="xs">{t`Sort:`}</Text>
        <Text size="xs">{columnLabel}</Text>
        <FontAwesomeIcon
          icon={direction === "asc" ? faArrowUp : faArrowDown}
          size="xs"
        />
      </Group>
    </Group>
  );
};

interface LeagueTableFooterProps {
  isFetching: boolean;
  offset: number;
  onPageChange: (offset: number) => void;
  pageCount: string;
  rowRange: string;
  total: number;
}

const LeagueTableFooter: FC<LeagueTableFooterProps> = ({
  isFetching,
  offset,
  onPageChange,
  pageCount,
  rowRange,
  total,
}) => {
  const { t } = useLingui();

  return (
    <Group justify="space-between" px="md" py="sm">
      <Text c="dimmed" size="sm">
        {rowRange}
      </Text>
      <TablePagination
        hasNextPage={offset + LEAGUE_PAGE_SIZE < total}
        isLoading={isFetching}
        loadingLabel={t`Updating leagues`}
        nextLabel={t`Next`}
        offset={offset}
        onPageChange={onPageChange}
        pageLabel={(page) => {
          const current = String(page);

          return t({
            comment: "Current page number in the leagues list",
            message: `Page ${current} of ${pageCount}`,
          });
        }}
        pageSize={LEAGUE_PAGE_SIZE}
        previousLabel={t`Previous`}
      />
    </Group>
  );
};

interface LeaguesTableProps {
  isFetching: boolean;
  leagues: League[];
  offset: number;
  onPageChange: (offset: number) => void;
  onSort: (sortBy: LeagueSortBy) => void;
  sortBy: LeagueSortBy;
  sortDirection: DataTableSortDirection;
  total: number;
}

export const LeaguesTable: FC<LeaguesTableProps> = ({
  isFetching,
  leagues,
  offset,
  onPageChange,
  onSort,
  sortBy,
  sortDirection,
  total,
}) => {
  const { t } = useLingui();
  const columns = useLeagueTableColumns();
  const formatters = useListFormatters();
  const rows = leagues.map((league, index) => ({
    league,
    ordinal: offset + index + 1,
  }));
  const firstRow = formatters.plain.format(total === 0 ? 0 : offset + 1);
  const lastRow = formatters.plain.format(
    Math.min(offset + leagues.length, total),
  );
  const totalRows = formatters.plain.format(total);
  const pageCount = String(Math.max(1, Math.ceil(total / LEAGUE_PAGE_SIZE)));
  const rowRange = t({
    comment: "Range of leagues shown out of the filtered total",
    message: `Showing ${firstRow}–${lastRow} of ${totalRows} leagues`,
  });

  const sortedColumn = columns.find((column) => column.sortKey === sortBy);

  return (
    <Paper radius="md" shadow="sm" style={TEAL_HOVER_STYLE}>
      <LeagueTableToolbar
        columnLabel={sortedColumn?.label ?? sortBy}
        direction={sortDirection}
      />
      <DataTable
        ariaLabel={t`Leagues`}
        columns={columns}
        getRowKey={(row) => row.league.id}
        minWidth={LEAGUE_TABLE_MIN_WIDTH}
        onSort={onSort}
        {...(isFetching && {
          renderSkeletonRow: (index: number) => (
            <SkeletonDataRow index={index} key={index} />
          ),
        })}
        rows={rows}
        sortBy={sortBy}
        sortDirection={sortDirection}
        sortLabel={(label) =>
          t({
            comment: "Accessible label for a sortable leagues table column",
            message: `Sort by ${label}`,
          })
        }
        stickyHeader
      />
      <LeagueTableFooter
        isFetching={isFetching}
        offset={offset}
        onPageChange={onPageChange}
        pageCount={pageCount}
        rowRange={rowRange}
        total={total}
      />
    </Paper>
  );
};
