import type { CSSProperties, Key, ReactNode } from "react";

import { faArrowDown } from "@fortawesome/pro-regular-svg-icons/faArrowDown";
import { faArrowUp } from "@fortawesome/pro-regular-svg-icons/faArrowUp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Box,
  Group,
  type MantineSpacing,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
  VisuallyHidden,
} from "@mantine/core";

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
  /** Defines what the column measures; shown on hover and read out to AT. */
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

const STICKY_CELL_Z_INDEX = 1;
const STICKY_HEADER_CELL_Z_INDEX = 3;
export const TOOLTIP_WIDTH = 240;

/*
 * The density of a table and of the chrome rows above and below it. Exported
 * because three other modules have to resolve to the same numbers: the toolbar
 * and footer a page composes around this table, and the skeleton that stands in
 * for all three. Any disagreement is a layout shift the moment data arrives.
 */
export const TABLE_VERTICAL_SPACING: MantineSpacing = "sm";
export const TABLE_TOOLBAR_PADDING = { px: "md", py: 4 } as const;
export const TABLE_FOOTER_PADDING = { px: "md", py: "xs" } as const;

// Mantine's default event set omits focus, which leaves the content
// unreachable by keyboard. The shared theme sets the same default, but a
// shared component cannot depend on the consumer's theme for keyboard access.
const TOOLTIP_EVENTS = { focus: true, hover: true, touch: false };

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

const stickyClass = (left: number | undefined): string | undefined =>
  left === undefined ? undefined : classes["stickyCell"];

const ariaSort = (
  isActive: boolean,
  direction: DataTableSortDirection,
): "ascending" | "descending" | "none" => {
  if (!isActive) return "none";
  return direction === "asc" ? "ascending" : "descending";
};

// Inactive columns reserve the icon's metrics invisibly: no directional noise
// (the learned rule), but every header shares one baseline and nothing shifts
// when the sort moves.
const sortIcon = (
  isActive: boolean,
  direction: DataTableSortDirection,
): ReactNode => (
  <FontAwesomeIcon
    icon={direction === "asc" ? faArrowUp : faArrowDown}
    {...(!isActive && { style: { visibility: "hidden" } })}
  />
);

interface HeaderCellProps<Row, SortKey extends string> {
  column: DataTableColumn<Row, SortKey>;
  left: number | undefined;
  onSort: (sortBy: SortKey) => void;
  sortBy: SortKey;
  sortDirection: DataTableSortDirection;
  sortLabel: (label: string) => string;
}

interface SortButtonProps {
  align: "center" | "left" | "right" | undefined;
  ariaLabel: string;
  icon: ReactNode;
  label: ReactNode;
  onClick: () => void;
  tooltip: string | undefined;
}

// Header labels are quiet chrome: uppercase mono, muted, regular weight. Bold
// headers compete with the data rows they describe.
const HEADER_LABEL_PROPS = {
  className: classes["headerLabel"] ?? "",
  component: "span",
  ff: "monospace",
  fw: 500,
  size: "xs",
  style: { whiteSpace: "nowrap" as const },
  tt: "uppercase",
} as const;

const SortButton = ({
  align,
  ariaLabel,
  icon,
  label,
  onClick,
  tooltip,
}: SortButtonProps): ReactNode => {
  const button = (
    <UnstyledButton aria-label={ariaLabel} onClick={onClick}>
      <Group
        align="baseline"
        gap={6}
        justify={align === "right" ? "flex-end" : "flex-start"}
        wrap="nowrap"
      >
        {align === "right" ? (
          <>
            <span aria-hidden="true">{icon}</span>
            <Text {...HEADER_LABEL_PROPS}>{label}</Text>
          </>
        ) : (
          <>
            <Text {...HEADER_LABEL_PROPS}>{label}</Text>
            <span aria-hidden="true">{icon}</span>
          </>
        )}
      </Group>
    </UnstyledButton>
  );

  // The tooltip wraps the button itself so keyboard focus opens it; a
  // wrapper element would leave the definition mouse-only.
  return tooltip === undefined ? (
    button
  ) : (
    <Tooltip
      events={TOOLTIP_EVENTS}
      label={tooltip}
      multiline
      w={TOOLTIP_WIDTH}
    >
      {button}
    </Tooltip>
  );
};

const HeaderCell = <Row, SortKey extends string>({
  column,
  left,
  onSort,
  sortBy,
  sortDirection,
  sortLabel,
}: HeaderCellProps<Row, SortKey>): ReactNode => {
  const isActive = column.sortKey === sortBy;
  const { sortKey, tooltip } = column;
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

  const heading =
    sortKey === undefined ? (
      <Text {...HEADER_LABEL_PROPS}>{label}</Text>
    ) : (
      <SortButton
        align={column.align}
        ariaLabel={sortLabel(column.label)}
        icon={sortIcon(isActive, sortDirection)}
        label={label}
        onClick={() => {
          onSort(sortKey);
        }}
        tooltip={tooltip}
      />
    );

  return (
    <Table.Th
      aria-sort={
        sortKey === undefined ? undefined : ariaSort(isActive, sortDirection)
      }
      className={[
        left === undefined ? classes["headerCell"] : undefined,
        stickyClass(left),
      ]
        .filter(Boolean)
        .join(" ")}
      miw={column.minWidth}
      style={stickyStyle(left, true)}
      ta={column.align}
      w={column.width}
    >
      {tooltip === undefined || sortKey !== undefined ? (
        heading
      ) : (
        <Tooltip label={tooltip} multiline w={TOOLTIP_WIDTH}>
          {/* Block so the wrapper does not disturb the cell's own alignment. */}
          <Box component="span" display="block">
            {heading}
          </Box>
        </Tooltip>
      )}
      {tooltip === undefined ? null : (
        // A hover tooltip never reaches a screen reader; the definition is
        // read out here regardless of which node carries the Tooltip.
        <VisuallyHidden>{tooltip}</VisuallyHidden>
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
  renderSkeletonRow,
  rows,
  sortBy,
  sortDirection,
  sortLabel,
  stickyHeader = false,
}: DataTableProps<Row, SortKey>): ReactNode => {
  const offsets = stickyOffsets(columns);

  return (
    <div style={{ overflowX: "auto" }}>
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
                      className={stickyClass(offsets.get(column.key))}
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
