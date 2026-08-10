import type { UseQueryResult } from "@tanstack/react-query";
import type { FC } from "react";

import type {
  ActorListReply,
  ActorSortBy,
  ActorSortDirection,
} from "../api/types";

import { ActorListEmpty } from "./ActorListStates/ActorListEmpty";
import { ActorListError } from "./ActorListStates/ActorListError";
import { ActorListLoading } from "./ActorListStates/ActorListLoading";
import { ActorsTable } from "./ActorsTable";

interface ActorListContentProps {
  offset: number;
  onPageChange: (offset: number) => void;
  onSort: (sortBy: ActorSortBy) => void;
  query: UseQueryResult<ActorListReply>;
  sortBy: ActorSortBy;
  sortDirection: ActorSortDirection;
}

export const ActorListContent: FC<ActorListContentProps> = ({
  offset,
  onPageChange,
  onSort,
  query,
  sortBy,
  sortDirection,
}) => {
  if (query.isPending) return <ActorListLoading />;

  if (query.isError) {
    return (
      <ActorListError
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }

  if (query.data.data.length === 0) return <ActorListEmpty />;

  return (
    <ActorsTable
      actors={query.data.data}
      isFetching={query.isFetching}
      offset={offset}
      onPageChange={onPageChange}
      onSort={onSort}
      sortBy={sortBy}
      sortDirection={sortDirection}
      total={query.data.meta.total}
    />
  );
};
