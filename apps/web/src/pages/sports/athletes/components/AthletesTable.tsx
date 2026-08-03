import { useLingui } from "@lingui/react/macro";
import {
  Avatar,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Table,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { type FC, useMemo } from "react";

import {
  type Athlete,
  ATHLETE_PAGE_SIZE,
  type AthleteSortBy,
  type AthleteSortDirection,
} from "../athlete-list-query";

interface AthletesTableProps {
  athletes: Athlete[];
  isFetching: boolean;
  onPageChange: (offset: number) => void;
  onSort: (sortBy: AthleteSortBy) => void;
  offset: number;
  sortBy: AthleteSortBy;
  sortDirection: AthleteSortDirection;
}

interface SortableHeaderProps {
  align?: "left" | "right";
  label: string;
  onSort: (sortBy: AthleteSortBy) => void;
  sortBy: AthleteSortBy;
  sortDirection: AthleteSortDirection;
  value: AthleteSortBy;
}

const getAriaSort = (
  isActive: boolean,
  sortDirection: AthleteSortDirection,
): "ascending" | "descending" | "none" => {
  if (!isActive) return "none";

  return sortDirection === "asc" ? "ascending" : "descending";
};

const getSortIndicator = (
  isActive: boolean,
  sortDirection: AthleteSortDirection,
): "↑" | "↓" | "↕" => {
  if (!isActive) return "↕";

  return sortDirection === "asc" ? "↑" : "↓";
};

const SortableHeader: FC<SortableHeaderProps> = ({
  align = "left",
  label,
  onSort,
  sortBy,
  sortDirection,
  value,
}) => {
  const { t } = useLingui();
  const isActive = sortBy === value;
  const ariaSort = getAriaSort(isActive, sortDirection);
  const sortIndicator = getSortIndicator(isActive, sortDirection);

  return (
    <Table.Th aria-sort={ariaSort} ta={align}>
      <UnstyledButton
        aria-label={t({
          comment: "Accessible label for a sortable athletes table column",
          message: `Sort by ${label}`,
        })}
        onClick={() => {
          onSort(value);
        }}
      >
        <Group
          gap={6}
          justify={align === "right" ? "flex-end" : "flex-start"}
          wrap="nowrap"
        >
          <Text component="span" fw={600} size="sm">
            {label}
          </Text>
          <span aria-hidden="true">{sortIndicator}</span>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
};

const AthletesTableHeader: FC<
  Pick<AthletesTableProps, "onSort" | "sortBy" | "sortDirection">
> = ({ onSort, sortBy, sortDirection }) => {
  const { t } = useLingui();

  return (
    <Table.Thead>
      <Table.Tr>
        <SortableHeader
          label={t`Athlete`}
          onSort={onSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
          value="name"
        />
        <SortableHeader
          label={t`Sport`}
          onSort={onSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
          value="sport"
        />
        <SortableHeader
          label={t`Nationality`}
          onSort={onSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
          value="nationality"
        />
        <SortableHeader
          label={t`Type`}
          onSort={onSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
          value="type"
        />
        <SortableHeader
          align="right"
          label={t`CM score`}
          onSort={onSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
          value="cmScore"
        />
      </Table.Tr>
    </Table.Thead>
  );
};

interface AthleteRowProps {
  athlete: Athlete;
  scoreFormatter: Intl.NumberFormat;
}

const AthleteRow: FC<AthleteRowProps> = ({ athlete, scoreFormatter }) => {
  const { t } = useLingui();
  const athleteId = athlete.id;
  const athleteIdText = String(athleteId);
  const athleteName =
    athlete.name ??
    t({
      comment: "Fallback name when an athlete profile has no name",
      message: "Unnamed athlete",
    });

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <Avatar alt={athleteName} name={athleteName} src={athlete.imageUrl} />
          <div>
            <Text fw={600}>{athleteName}</Text>
            <Text c="dimmed" size="xs">
              {t({
                comment:
                  "Numeric Chartmetric profile identifier shown below an athlete name",
                message: `ID ${athleteIdText}`,
              })}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>{athlete.sport ?? "—"}</Table.Td>
      <Table.Td>{athlete.nationality ?? "—"}</Table.Td>
      <Table.Td>
        {athlete.type === null ? (
          "—"
        ) : (
          <Badge variant="light">{athlete.type}</Badge>
        )}
      </Table.Td>
      <Table.Td ta="right">
        {athlete.cmScore === null
          ? "—"
          : scoreFormatter.format(athlete.cmScore)}
      </Table.Td>
    </Table.Tr>
  );
};

const AthletePagination: FC<AthletesTableProps> = ({
  athletes,
  isFetching,
  onPageChange,
  offset,
}) => {
  const { t } = useLingui();
  const currentPage = Math.floor(offset / ATHLETE_PAGE_SIZE) + 1;
  const currentPageText = String(currentPage);

  return (
    <Group justify="space-between" p="md" wrap="nowrap">
      <Button
        disabled={offset === 0 || isFetching}
        onClick={() => {
          onPageChange(Math.max(0, offset - ATHLETE_PAGE_SIZE));
        }}
        variant="default"
      >
        {t({
          comment: "Pagination button for the previous athletes page",
          message: "Previous",
        })}
      </Button>
      <Group gap="xs" wrap="nowrap">
        {isFetching ? (
          <Loader aria-label={t`Updating athletes`} size="xs" />
        ) : null}
        <Text c="dimmed" size="sm">
          {t({
            comment: "Current page number in the athletes list",
            message: `Page ${currentPageText}`,
          })}
        </Text>
      </Group>
      <Button
        disabled={athletes.length < ATHLETE_PAGE_SIZE || isFetching}
        onClick={() => {
          onPageChange(offset + ATHLETE_PAGE_SIZE);
        }}
        variant="default"
      >
        {t({
          comment: "Pagination button for the next athletes page",
          message: "Next",
        })}
      </Button>
    </Group>
  );
};

export const AthletesTable: FC<AthletesTableProps> = (props) => {
  const { i18n } = useLingui();
  const scoreFormatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      }),
    [i18n.locale],
  );

  return (
    <Paper radius="md" withBorder>
      <Table.ScrollContainer minWidth={760}>
        <Table highlightOnHover verticalSpacing="md">
          <AthletesTableHeader
            onSort={props.onSort}
            sortBy={props.sortBy}
            sortDirection={props.sortDirection}
          />
          <Table.Tbody>
            {props.athletes.map((athlete) => (
              <AthleteRow
                athlete={athlete}
                key={athlete.id}
                scoreFormatter={scoreFormatter}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <AthletePagination {...props} />
    </Paper>
  );
};
