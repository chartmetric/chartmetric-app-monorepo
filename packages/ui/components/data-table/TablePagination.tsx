import type { FC } from "react";

import { Button, Group, Loader, Text } from "@mantine/core";

export interface TablePaginationProps {
  hasNextPage: boolean;
  isLoading: boolean;
  loadingLabel: string;
  nextLabel: string;
  offset: number;
  onPageChange: (offset: number) => void;
  pageLabel: (page: number) => string;
  pageSize: number;
  previousLabel: string;
}

export const TablePagination: FC<TablePaginationProps> = ({
  hasNextPage,
  isLoading,
  loadingLabel,
  nextLabel,
  offset,
  onPageChange,
  pageLabel,
  pageSize,
  previousLabel,
}) => {
  const currentPage = Math.floor(offset / pageSize) + 1;

  return (
    <Group justify="space-between" p="md" wrap="nowrap">
      <Button
        disabled={offset === 0 || isLoading}
        onClick={() => {
          onPageChange(Math.max(0, offset - pageSize));
        }}
        variant="default"
      >
        {previousLabel}
      </Button>
      <Group gap="xs" wrap="nowrap">
        {isLoading ? <Loader aria-label={loadingLabel} size="xs" /> : null}
        <Text c="dimmed" size="sm">
          {pageLabel(currentPage)}
        </Text>
      </Group>
      <Button
        disabled={!hasNextPage || isLoading}
        onClick={() => {
          onPageChange(offset + pageSize);
        }}
        variant="default"
      >
        {nextLabel}
      </Button>
    </Group>
  );
};
