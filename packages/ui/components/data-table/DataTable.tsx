import { Group, Table, Text, UnstyledButton } from "@mantine/core";
import {
  type CSSProperties,
  type Key,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";

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
  // Mantine documents this as incompatible with `Table.ScrollContainer`,
  // which this component always wraps in. Confirm in a browser before relying.
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

const stickyClass = (
  left: number | undefined,
  isLast = false,
): string | undefined => {
  if (left === undefined) return undefined;
  return [classes["stickyCell"], isLast ? classes["lastStickyCell"] : undefined]
    .filter(Boolean)
    .join(" ");
};

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
  isLast: boolean;
  left: number | undefined;
  onSort: (sortBy: SortKey) => void;
  sortBy: SortKey;
  sortDirection: DataTableSortDirection;
  sortLabel: (label: string) => string;
}

const HeaderCell = <Row, SortKey extends string>({
  column,
  isLast,
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
      className={[classes["headerCell"], stickyClass(left, isLast)]
        .filter(Boolean)
        .join(" ")}
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

  const lastStickyKey = useMemo(() => {
    let last: string | undefined;
    for (const col of columns) {
      if (col.sticky !== true) break;
      last = col.key;
    }
    return last;
  }, [columns]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    const scrolledClass = classes["scrolled"];
    if (element !== null && scrolledClass !== undefined) {
      element.classList.toggle(scrolledClass, element.scrollLeft > 0);
    }
  }, []);

  return (
    <div
      onScroll={handleScroll}
      ref={scrollRef}
      style={{ minWidth, overflowX: "auto" }}
    >
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
          {rows.map((row) => (
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
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
};
