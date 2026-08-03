import { useLingui } from "@lingui/react/macro";
import { Avatar, Badge, Group, Paper, Text } from "@mantine/core";
import { DataTable, type DataTableColumn } from "@repo/ui/data-table";
import { TablePagination } from "@repo/ui/table-pagination";
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

interface AthleteIdentityProps {
  athlete: Athlete;
}

const AthleteIdentity: FC<AthleteIdentityProps> = ({ athlete }) => {
  const { t } = useLingui();
  const athleteName =
    athlete.name ??
    t({
      comment: "Fallback name when an athlete profile has no name",
      message: "Unnamed athlete",
    });
  const athleteIdText = String(athlete.id);

  return (
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
  );
};

const AthleteType: FC<{ type: string | null }> = ({ type }) =>
  type === null ? "—" : <Badge variant="light">{type}</Badge>;

const useAthleteTableColumns = (): DataTableColumn<
  Athlete,
  AthleteSortBy
>[] => {
  const { i18n, t } = useLingui();
  const scoreFormatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      }),
    [i18n.locale],
  );
  return useMemo<DataTableColumn<Athlete, AthleteSortBy>[]>(
    () => [
      {
        key: "athlete",
        label: t`Athlete`,
        renderCell: (athlete) => <AthleteIdentity athlete={athlete} />,
        sortKey: "name",
      },
      {
        key: "sport",
        label: t`Sport`,
        renderCell: (athlete) => athlete.sport ?? "—",
        sortKey: "sport",
      },
      {
        key: "nationality",
        label: t`Nationality`,
        renderCell: (athlete) => athlete.nationality ?? "—",
        sortKey: "nationality",
      },
      {
        key: "type",
        label: t`Type`,
        renderCell: (athlete) => <AthleteType type={athlete.type} />,
        sortKey: "type",
      },
      {
        align: "right",
        key: "cmScore",
        label: t`CM score`,
        renderCell: (athlete) =>
          athlete.cmScore === null
            ? "—"
            : scoreFormatter.format(athlete.cmScore),
        sortKey: "cmScore",
      },
    ],
    [scoreFormatter, t],
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
}) => {
  const { t } = useLingui();
  const columns = useAthleteTableColumns();

  const formatPageLabel = (page: number): string => {
    const currentPageText = String(page);

    return t({
      comment: "Current page number in the athletes list",
      message: `Page ${currentPageText}`,
    });
  };

  return (
    <Paper radius="md" withBorder>
      <DataTable
        ariaLabel={t`Athletes`}
        columns={columns}
        getRowKey={(athlete) => athlete.id}
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
      />
      <TablePagination
        hasNextPage={athletes.length === ATHLETE_PAGE_SIZE}
        isLoading={isFetching}
        loadingLabel={t`Updating athletes`}
        nextLabel={t`Next`}
        offset={offset}
        onPageChange={onPageChange}
        pageLabel={formatPageLabel}
        pageSize={ATHLETE_PAGE_SIZE}
        previousLabel={t`Previous`}
      />
    </Paper>
  );
};
