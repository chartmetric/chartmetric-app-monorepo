import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Box, Group, Paper, Text } from "@mantine/core";
import { DataTable } from "@repo/ui/data-table";
import { TablePagination } from "@repo/ui/table-pagination";

import type { Actor, ActorSortBy, ActorSortDirection } from "../api/types";

import { useListFormatters } from "../../../../lib/formatting";
import { ACTOR_PAGE_SIZE } from "../api/actor-list";
import {
  ACTOR_COLUMN_WIDTH,
  INDEX_COLUMN_WIDTH,
  SCROLLING_COLUMNS_MIN_WIDTH,
  useActorTableColumns,
} from "../table-columns";

interface ActorsTableProps {
  actors: Actor[];
  isFetching: boolean;
  offset: number;
  onPageChange: (offset: number) => void;
  onSort: (sortBy: ActorSortBy) => void;
  sortBy: ActorSortBy;
  sortDirection: ActorSortDirection;
  total: number;
}

export const ActorsTable: FC<ActorsTableProps> = ({
  actors,
  isFetching,
  offset,
  onPageChange,
  onSort,
  sortBy,
  sortDirection,
  total,
}) => {
  const { t } = useLingui();
  const columns = useActorTableColumns(actors, offset);
  const formatters = useListFormatters();
  const firstRow = formatters.plain.format(total === 0 ? 0 : offset + 1);
  const lastRow = formatters.plain.format(
    Math.min(offset + actors.length, total),
  );
  const totalRows = formatters.plain.format(total);
  const pageCount = String(Math.max(1, Math.ceil(total / ACTOR_PAGE_SIZE)));

  return (
    <Paper radius="md" withBorder>
      <Box aria-busy={isFetching}>
        <DataTable
          ariaLabel={t`Actors`}
          columns={columns}
          getRowKey={(actor) => actor.id}
          minWidth={
            INDEX_COLUMN_WIDTH +
            ACTOR_COLUMN_WIDTH +
            SCROLLING_COLUMNS_MIN_WIDTH
          }
          onSort={onSort}
          rows={actors}
          sortBy={sortBy}
          sortDirection={sortDirection}
          sortLabel={(label) =>
            t({
              comment: "Accessible label for a sortable actors table column",
              message: `Sort by ${label}`,
            })
          }
          stickyHeader
        />
      </Box>
      <Group justify="flex-start" pt="sm" px="md">
        <Text c="dimmed" size="sm">
          {t({
            comment: "Range of actors shown out of the total",
            message: `Showing ${firstRow}–${lastRow} of ${totalRows} actors`,
          })}
        </Text>
      </Group>
      <TablePagination
        hasNextPage={offset + ACTOR_PAGE_SIZE < total}
        isLoading={isFetching}
        loadingLabel={t`Updating actors`}
        nextLabel={t`Next`}
        offset={offset}
        onPageChange={onPageChange}
        pageLabel={(page) => {
          const current = String(page);

          return t({
            comment: "Current page number in the actors list",
            message: `Page ${current} of ${pageCount}`,
          });
        }}
        pageSize={ACTOR_PAGE_SIZE}
        previousLabel={t`Previous`}
      />
    </Paper>
  );
};
