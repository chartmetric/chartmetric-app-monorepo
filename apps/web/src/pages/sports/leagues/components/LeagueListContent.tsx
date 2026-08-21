import type { DataTableSortDirection } from "@repo/ui/data-table";
import type { UseQueryResult } from "@tanstack/react-query";
import type { FC } from "react";

import type { LeagueListReply, LeagueSortBy } from "../api/types";

import { LeagueListEmpty } from "./LeagueListStates/LeagueListEmpty";
import { LeagueListError } from "./LeagueListStates/LeagueListError";
import { LeagueListLoading } from "./LeagueListStates/LeagueListLoading";
import { LeaguesTable } from "./LeaguesTable";

export interface LeagueListContentProps {
  offset: number;
  onPageChange: (offset: number) => void;
  onSort: (sortBy: LeagueSortBy) => void;
  query: UseQueryResult<LeagueListReply>;
  sortBy: LeagueSortBy;
  sortDirection: DataTableSortDirection;
}

export const LeagueListContent: FC<LeagueListContentProps> = ({
  offset,
  onPageChange,
  onSort,
  query,
  sortBy,
  sortDirection,
}) => {
  if (query.isPending) return <LeagueListLoading />;

  if (query.isError) {
    return (
      <LeagueListError
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }

  if (query.data.data.length === 0) return <LeagueListEmpty />;

  return (
    <LeaguesTable
      isFetching={query.isFetching}
      leagues={query.data.data}
      offset={offset}
      onPageChange={onPageChange}
      onSort={onSort}
      sortBy={sortBy}
      sortDirection={sortDirection}
      total={query.data.meta.total}
    />
  );
};
