import type { FC } from "react";

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
  total: number;
  visibleColumns: readonly AthleteColumnKey[];
}

const SCROLLING_COLUMNS_MIN_WIDTH = 640;

export const AthletesTable: FC<AthletesTableProps> = ({
  athletes,
  isFetching,
  offset,
  onPageChange,
  onSort,
  sortBy,
  sortDirection,
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

  return (
    <Paper radius="md" shadow="sm">
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
      <Group justify="space-between" px="md" py="sm">
        <Text c="dimmed" size="sm">
          {t({
            comment: "Range of athletes shown out of the filtered total",
            message: `Showing ${firstRow}–${lastRow} of ${totalRows} athletes`,
          })}
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
    </Paper>
  );
};
