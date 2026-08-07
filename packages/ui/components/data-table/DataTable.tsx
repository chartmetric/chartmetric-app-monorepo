import type { CSSProperties, Key, ReactNode } from "react";

import { Group, Table, Text, UnstyledButton } from "@mantine/core";

import classes from "./DataTable.module.css";

export type DataTableSortDirection = "asc" | "desc";

export interface DataTableColumn<Row, SortKey extends string> {
  align?: "center" | "left" | "right";
  key: string;
  label: string;
  minWidth?: number;
  renderCell: (row: Row) => ReactNode;
  secondaryLabel?: string;
  sortKey?: SortKey;
  /**
   * Pins the column to the left edge while the remaining columns scroll.
   * Sticky columns must be declared before any non-sticky column, and each
   * needs a `width` so the offsets of those after it can be resolved.
   */
  sticky?: boolean;
  width?: number;
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
  /**
   * Keeps the header visible while the body scrolls. Mantine documents this as
   * incompatible with `Table.ScrollContainer`, which this component always
   * wraps in, so confirm it in a browser before relying on it.
   */
  stickyHeader?: boolean;
}

const STICKY_CELL_Z_INDEX = 1;
const STICKY_HEADER_CELL_Z_INDEX = 3;

const stickyOffsets = <Row, SortKey extends string>(
  columns: readonly DataTableColumn<Row, SortKey>[],
): Map<string, number> => {
  const offsets = new Map<string, number>();
  let offset = 0;

  for (const column of columns) {
    if (column.sticky !== true) break;
    offsets.set(column.key, offset);
    offset += column.width ?? 0;
  }

  return offsets;
};

const stickyStyle = (
  left: number | undefined,
  isHeader: boolean,
): CSSProperties | undefined =>
  left === undefined
    ? undefined
    : {
        left,
        zIndex: isHeader ? STICKY_HEADER_CELL_Z_INDEX : STICKY_CELL_Z_INDEX,
      };

// Paired with `stickyStyle`: the class carries the background and `position`,
// which a hover rule needs to override and an inline style cannot.
const stickyClass = (left: number | undefined): string | undefined =>
  left === undefined ? undefined : classes["stickyCell"];

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

interface HeaderCellProps<Row, SortKey extends string> {
  column: DataTableColumn<Row, SortKey>;
  left: number | undefined;
  onSort: (sortBy: SortKey) => void;
  sortBy: SortKey;
  sortDirection: DataTableSortDirection;
  sortLabel: (label: string) => string;
}

const HeaderCell = <Row, SortKey extends string>({
  column,
  left,
  onSort,
  sortBy,
  sortDirection,
  sortLabel,
}: HeaderCellProps<Row, SortKey>): ReactNode => {
  const isActive = column.sortKey === sortBy;
  const { sortKey } = column;
  const label =
    column.secondaryLabel === undefined ? (
      column.label
    ) : (
      <>
        <Text c="dimmed" component="span" display="block" size="xs">
          {column.secondaryLabel}
        </Text>
        {column.label}
      </>
    );

  return (
    <Table.Th
      aria-sort={
        sortKey === undefined ? undefined : ariaSort(isActive, sortDirection)
      }
      className={stickyClass(left)}
      miw={column.minWidth}
      style={stickyStyle(left, true)}
      ta={column.align}
      w={column.width}
    >
      {sortKey === undefined ? (
        label
      ) : (
        <UnstyledButton
          aria-label={sortLabel(column.label)}
          onClick={() => {
            onSort(sortKey);
          }}
        >
          <Group
            gap={6}
            justify={column.align === "right" ? "flex-end" : "flex-start"}
            wrap="nowrap"
          >
            <Text component="span" fw={600} size="sm">
              {label}
            </Text>
            <span aria-hidden="true">
              {sortIndicator(isActive, sortDirection)}
            </span>
          </Group>
        </UnstyledButton>
      )}
    </Table.Th>
  );
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
  stickyHeader = false,
}: DataTableProps<Row, SortKey>): ReactNode => {
  const offsets = stickyOffsets(columns);

  return (
    <Table.ScrollContainer minWidth={minWidth}>
      <Table
        aria-label={ariaLabel}
        highlightOnHover
        stickyHeader={stickyHeader}
        verticalSpacing="md"
      >
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <HeaderCell
                column={column}
                key={column.key}
                left={offsets.get(column.key)}
                onSort={onSort}
                sortBy={sortBy}
                sortDirection={sortDirection}
                sortLabel={sortLabel}
              />
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={getRowKey(row)}>
              {columns.map((column) => (
                <Table.Td
                  className={stickyClass(offsets.get(column.key))}
                  key={column.key}
                  style={stickyStyle(offsets.get(column.key), false)}
                  ta={column.align}
                >
                  {column.renderCell(row)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};
