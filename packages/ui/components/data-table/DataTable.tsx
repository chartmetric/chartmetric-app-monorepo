import type { Key, ReactNode } from "react";

import { Group, Table, Text, UnstyledButton } from "@mantine/core";

export type DataTableSortDirection = "asc" | "desc";

export interface DataTableColumn<Row, SortKey extends string> {
  align?: "left" | "right";
  key: string;
  label: string;
  renderCell: (row: Row) => ReactNode;
  sortKey?: SortKey;
}

export interface DataTableProps<Row, SortKey extends string> {
  ariaLabel: string;
  columns: readonly DataTableColumn<Row, SortKey>[];
  getRowKey: (row: Row) => Key;
  minWidth?: number;
  onSort: (sortBy: SortKey) => void;
  rows: readonly Row[];
  sortBy: SortKey;
  sortDirection: DataTableSortDirection;
  sortLabel: (label: string) => string;
}

const ariaSort = (
  isActive: boolean,
  direction: DataTableSortDirection,
): "ascending" | "descending" | "none" => {
  if (!isActive) return "none";
  return direction === "asc" ? "ascending" : "descending";
};

const sortIndicator = (
  isActive: boolean,
  direction: DataTableSortDirection,
): "↑" | "↓" | "↕" => {
  if (!isActive) return "↕";
  return direction === "asc" ? "↑" : "↓";
};

export const DataTable = <Row, SortKey extends string>({
  ariaLabel,
  columns,
  getRowKey,
  minWidth = 760,
  onSort,
  rows,
  sortBy,
  sortDirection,
  sortLabel,
}: DataTableProps<Row, SortKey>): ReactNode => (
  <Table.ScrollContainer minWidth={minWidth}>
    <Table aria-label={ariaLabel} highlightOnHover verticalSpacing="md">
      <Table.Thead>
        <Table.Tr>
          {columns.map((column) => {
            const isActive = column.sortKey === sortBy;

            return (
              <Table.Th
                aria-sort={
                  column.sortKey === undefined
                    ? undefined
                    : ariaSort(isActive, sortDirection)
                }
                key={column.key}
                ta={column.align}
              >
                {column.sortKey === undefined ? (
                  column.label
                ) : (
                  <UnstyledButton
                    aria-label={sortLabel(column.label)}
                    onClick={() => {
                      if (column.sortKey !== undefined) onSort(column.sortKey);
                    }}
                  >
                    <Group
                      gap={6}
                      justify={
                        column.align === "right" ? "flex-end" : "flex-start"
                      }
                      wrap="nowrap"
                    >
                      <Text component="span" fw={600} size="sm">
                        {column.label}
                      </Text>
                      <span aria-hidden="true">
                        {sortIndicator(isActive, sortDirection)}
                      </span>
                    </Group>
                  </UnstyledButton>
                )}
              </Table.Th>
            );
          })}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={getRowKey(row)}>
            {columns.map((column) => (
              <Table.Td key={column.key} ta={column.align}>
                {column.renderCell(row)}
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  </Table.ScrollContainer>
);
