import type { UseQueryResult } from "@tanstack/react-query";
import type { FC, ReactNode } from "react";

import type {
  AthleteListReply,
  AthleteSortBy,
  AthleteSortDirection,
} from "../api/types";
import type { AthleteColumnKey } from "../columns/types";

import { AthleteListEmpty } from "./AthleteListStates/AthleteListEmpty";
import { AthleteListError } from "./AthleteListStates/AthleteListError";
import { AthleteListLoading } from "./AthleteListStates/AthleteListLoading";
import { AthletesTable } from "./AthletesTable";

export interface AthleteListContentProps {
  offset: number;
  onPageChange: (offset: number) => void;
  onSort: (sortBy: AthleteSortBy) => void;
  query: UseQueryResult<AthleteListReply>;
  sortBy: AthleteSortBy;
  sortDirection: AthleteSortDirection;
  toolbar?: ReactNode;
  visibleColumns: readonly AthleteColumnKey[];
}

export const AthleteListContent: FC<AthleteListContentProps> = ({
  offset,
  onPageChange,
  onSort,
  query,
  sortBy,
  sortDirection,
  toolbar,
  visibleColumns,
}) => {
  if (query.isPending) return <AthleteListLoading />;

  if (query.isError) {
    return (
      <AthleteListError
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }

  if (query.data.data.length === 0) return <AthleteListEmpty />;

  return (
    <AthletesTable
      athletes={query.data.data}
      isFetching={query.isFetching}
      offset={offset}
      onPageChange={onPageChange}
      onSort={onSort}
      sortBy={sortBy}
      sortDirection={sortDirection}
      toolbar={toolbar}
      total={query.data.meta.total}
      visibleColumns={visibleColumns}
    />
  );
};
