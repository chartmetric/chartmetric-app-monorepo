import type { FC, ReactNode } from "react";

import { useLingui } from "@lingui/react/macro";
import { Box, Group, LoadingOverlay, Paper, Text } from "@mantine/core";
import { DataTable } from "@repo/ui/data-table";
import { TablePagination } from "@repo/ui/table-pagination";

import type {
  Athlete,
  AthleteSortBy,
  AthleteSortDirection,
} from "../api/types";
import type { AthleteColumnKey } from "../columns/types";

import { useListFormatters } from "../../../../lib/formatting";
import { ATHLETE_PAGE_SIZE } from "../api/athlete-list";
import {
  ATHLETE_COLUMN_WIDTH,
  RANK_COLUMN_WIDTH,
  useAthleteTableColumns,
} from "../columns/table-columns";

interface AthletesTableProps {
  athletes: Athlete[];
  isFetching: boolean;
  offset: number;
  onPageChange: (offset: number) => void;
  onSort: (sortBy: AthleteSortBy) => void;
  sortBy: AthleteSortBy;
  sortDirection: AthleteSortDirection;
  toolbar?: ReactNode;
  total: number;
  visibleColumns: readonly AthleteColumnKey[];
}

const SCROLLING_COLUMNS_MIN_WIDTH = 640;

// Teal hover: product accent instead of Mantine's default gray.
// See design memory: "Principle: row hover color = product accent, not OS default".
const TEAL_HOVER_STYLE = {
  "--table-highlight-on-hover-color": "var(--mantine-color-teal-light)",
} as const;

interface TableFooterProps {
  isFetching: boolean;
  offset: number;
  onPageChange: (offset: number) => void;
  pageCount: string;
  rowRange: string;
  total: number;
}

const TableFooter: FC<TableFooterProps> = ({
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
        hasNextPage={offset + ATHLETE_PAGE_SIZE < total}
        isLoading={isFetching}
        loadingLabel={t`Updating athletes`}
        nextLabel={t`Next`}
        offset={offset}
        onPageChange={onPageChange}
        pageLabel={(page) => {
          const current = String(page);

          return t({
            comment: "Current page number in the athletes list",
            message: `Page ${current} of ${pageCount}`,
          });
        }}
        pageSize={ATHLETE_PAGE_SIZE}
        previousLabel={t`Previous`}
      />
    </Group>
  );
};

export const AthletesTable: FC<AthletesTableProps> = ({
  athletes,
  isFetching,
  offset,
  onPageChange,
  onSort,
  sortBy,
  sortDirection,
  toolbar,
  total,
  visibleColumns,
}) => {
  const { t } = useLingui();
  const columns = useAthleteTableColumns(visibleColumns);
  const formatters = useListFormatters();
  const firstRow = formatters.plain.format(total === 0 ? 0 : offset + 1);
  const lastRow = formatters.plain.format(
    Math.min(offset + athletes.length, total),
  );
  const totalRows = formatters.plain.format(total);
  const pageCount = String(Math.max(1, Math.ceil(total / ATHLETE_PAGE_SIZE)));
  const rowRange = t({
    comment: "Range of athletes shown out of the filtered total",
    message: `Showing ${firstRow}–${lastRow} of ${totalRows} athletes`,
  });

  return (
    <Paper radius="md" shadow="sm" style={TEAL_HOVER_STYLE}>
      <Group justify="flex-end" px="md" py="xs">
        {toolbar}
      </Group>
      <Box pos="relative">
        <LoadingOverlay
          loaderProps={{ "aria-label": t`Updating athletes` }}
          overlayProps={{ blur: 1 }}
          visible={isFetching}
          zIndex={2}
        />
        <DataTable
          ariaLabel={t`Athletes`}
          columns={columns}
          getRowKey={(athlete) => athlete.id}
          minWidth={
            RANK_COLUMN_WIDTH +
            ATHLETE_COLUMN_WIDTH +
            SCROLLING_COLUMNS_MIN_WIDTH
          }
          onSort={onSort}
          rows={athletes}
          sortBy={sortBy}
          sortDirection={sortDirection}
          sortLabel={(label) =>
            t({
              comment: "Accessible label for a sortable athletes table column",
              message: `Sort by ${label}`,
            })
          }
          stickyHeader
        />
      </Box>
      <TableFooter
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
