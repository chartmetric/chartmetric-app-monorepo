import type { ReactNode } from "react";

import { faArrowDown } from "@fortawesome/pro-regular-svg-icons/faArrowDown";
import { faArrowUp } from "@fortawesome/pro-regular-svg-icons/faArrowUp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Box,
  Group,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
  VisuallyHidden,
} from "@mantine/core";

import type { DataTableColumn, DataTableSortDirection } from "./DataTable";

import classes from "./DataTable.module.css";
import { stickyClass, stickyStyle } from "./sticky";
import { TOOLTIP_EVENTS, TOOLTIP_WIDTH } from "./table-tokens";

const ariaSort = (
  isActive: boolean,
  direction: DataTableSortDirection,
): "ascending" | "descending" | "none" => {
  if (!isActive) return "none";
  return direction === "asc" ? "ascending" : "descending";
};

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
  isLast: boolean;
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

export const HeaderCell = <Row, SortKey extends string>({
  column,
  isLast,
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
        stickyClass(left, isLast),
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
