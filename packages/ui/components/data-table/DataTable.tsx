import type { Key, ReactNode } from "react";

import { Table } from "@mantine/core";

import classes from "./DataTable.module.css";
import { HeaderCell } from "./HeaderCell";
import { stickyClass, stickyStyle } from "./sticky";
import { TABLE_VERTICAL_SPACING } from "./table-tokens";

export type DataTableSortDirection = "asc" | "desc";

export interface DataTableColumn<Row, SortKey extends string> {
  align?: "center" | "left" | "right";
  key: string;
  label: string;
  minWidth?: number;
  renderCell: (row: Row) => ReactNode;
  secondaryLabel?: string;
  sortKey?: SortKey;
  sticky?: boolean;
  tooltip?: string;
  width?: number;
}

export interface DataTableProps<Row, SortKey extends string> {
  ariaLabel: string;
  columns: readonly DataTableColumn<Row, SortKey>[];
  getRowKey: (row: Row) => Key;
  // When provided, renders this instead of data rows. Pass during refetch so
  // headers stay real (sort state visible) and row count stays fixed (no layout shift).
  renderSkeletonRow?: (index: number) => ReactNode;
  minWidth?: number;
  onSort: (sortBy: SortKey) => void;
  rows: readonly Row[];
  sortBy: SortKey;
  sortDirection: DataTableSortDirection;
  sortLabel: (label: string) => string;
  // Mantine documents this as incompatible with `Table.ScrollContainer`,
  // which this component always wraps in. Confirm in a browser before relying.
  stickyHeader?: boolean;
}

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

export const DataTable = <Row, SortKey extends string>({
  ariaLabel,
  columns,
  getRowKey,
  minWidth = 760,
  onSort,
  renderSkeletonRow,
  rows,
  sortBy,
  sortDirection,
  sortLabel,
  stickyHeader = false,
}: DataTableProps<Row, SortKey>): ReactNode => {
  const offsets = stickyOffsets(columns);

  let lastStickyKey: string | undefined;
  for (const key of offsets.keys()) lastStickyKey = key;

  // Class toggling instead of state: a scroll position change must not
  // re-render every row.
  const handleScroll = (event: React.UIEvent<HTMLDivElement>): void => {
    const scrolledClass = classes["scrolled"];
    if (scrolledClass !== undefined) {
      event.currentTarget.classList.toggle(
        scrolledClass,
        event.currentTarget.scrollLeft > 0,
      );
    }
  };

  return (
    <div onScroll={handleScroll} style={{ overflowX: "auto" }}>
      <Table
        aria-label={ariaLabel}
        highlightOnHover
        stickyHeader={stickyHeader}
        style={{ minWidth }}
        verticalSpacing={TABLE_VERTICAL_SPACING}
      >
        <Table.Thead>
          <Table.Tr className={classes["headerRow"]}>
            {columns.map((column) => (
              <HeaderCell
                column={column}
                isLast={column.key === lastStickyKey}
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
          {renderSkeletonRow === undefined
            ? rows.map((row) => (
                <Table.Tr key={getRowKey(row)}>
                  {columns.map((column) => (
                    <Table.Td
                      className={stickyClass(
                        offsets.get(column.key),
                        column.key === lastStickyKey,
                      )}
                      key={column.key}
                      style={stickyStyle(offsets.get(column.key), false)}
                      ta={column.align}
                    >
                      {column.renderCell(row)}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            : Array.from({ length: rows.length }, (_, index): ReactNode =>
                renderSkeletonRow(index),
              )}
        </Table.Tbody>
      </Table>
    </div>
  );
};
