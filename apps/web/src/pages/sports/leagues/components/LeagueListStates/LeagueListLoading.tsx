import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Group, Paper, Skeleton, Stack, Table } from "@mantine/core";

import { LEAGUE_PAGE_SIZE } from "../../api/league-list";
import {
  IG_REACH_MIN_WIDTH,
  KEY_ATHLETES_MIN_WIDTH,
  LEAGUE_COLUMN_WIDTH,
  LEAGUE_TABLE_MIN_WIDTH,
  NATIONALITIES_MIN_WIDTH,
  ORDINAL_COLUMN_WIDTH,
  TRACKED_ATHLETES_MIN_WIDTH,
} from "../../columns/table-columns";

// Mirrors LeagueTableToolbar: Group justify="space-between" px="md" py="xs"
const SkeletonToolbar: FC = () => (
  <Group justify="space-between" px="md" py="xs">
    <Skeleton height="calc(var(--mantine-font-size-xs) * 1.55)" w={110} />
  </Group>
);

// Mirrors LeagueTableFooter: Group justify="space-between" px="md" py="sm"
const SkeletonFooter: FC = () => (
  <Group justify="space-between" px="md" py="sm">
    <Skeleton height="calc(var(--mantine-font-size-sm) * 1.55)" w={180} />
    <Skeleton height={30} radius="sm" w={120} />
  </Group>
);

const SkeletonHeaderRow: FC = () => (
  <Table.Tr>
    <Table.Th w={ORDINAL_COLUMN_WIDTH}>
      <Skeleton height={12} w={16} />
    </Table.Th>
    <Table.Th w={LEAGUE_COLUMN_WIDTH}>
      <Skeleton height={12} w={150} />
    </Table.Th>
    <Table.Th miw={TRACKED_ATHLETES_MIN_WIDTH}>
      <Skeleton height={12} ml="auto" w={56} />
    </Table.Th>
    <Table.Th miw={IG_REACH_MIN_WIDTH}>
      <Skeleton height={12} ml="auto" w={64} />
    </Table.Th>
    <Table.Th miw={KEY_ATHLETES_MIN_WIDTH}>
      <Skeleton height={12} w={84} />
    </Table.Th>
    <Table.Th miw={NATIONALITIES_MIN_WIDTH}>
      <Skeleton height={12} w={90} />
    </Table.Th>
  </Table.Tr>
);

export const SkeletonDataRow: FC<{ index: number }> = ({ index }) => (
  <Table.Tr key={index}>
    <Table.Td w={ORDINAL_COLUMN_WIDTH}>
      <Skeleton height={12} w={16} />
    </Table.Td>
    <Table.Td w={LEAGUE_COLUMN_WIDTH}>
      <Group gap="sm" wrap="nowrap">
        <Skeleton height={40} radius="sm" w={40} />
        <Stack gap={2} style={{ flex: 1 }}>
          <Skeleton height="calc(var(--mantine-font-size-sm) * 1.55)" w="70%" />
          <Skeleton height="calc(var(--mantine-font-size-xs) * 1.55)" w="40%" />
        </Stack>
      </Group>
    </Table.Td>
    <Table.Td miw={TRACKED_ATHLETES_MIN_WIDTH}>
      <Skeleton
        height="calc(var(--mantine-font-size-xs) * 1.55)"
        ml="auto"
        w={40}
      />
    </Table.Td>
    <Table.Td miw={IG_REACH_MIN_WIDTH}>
      <Skeleton
        height="calc(var(--mantine-font-size-xs) * 1.55)"
        ml="auto"
        w={52}
      />
    </Table.Td>
    <Table.Td miw={KEY_ATHLETES_MIN_WIDTH}>
      <Group gap={4} wrap="nowrap">
        <Skeleton height={18} radius="sm" w={92} />
        <Skeleton height={18} radius="sm" w={80} />
        <Skeleton height={18} radius="sm" w={86} />
      </Group>
    </Table.Td>
    <Table.Td miw={NATIONALITIES_MIN_WIDTH}>
      <Skeleton height="calc(var(--mantine-font-size-xs) * 1.55)" w={168} />
    </Table.Td>
  </Table.Tr>
);

export const LeagueListLoading: FC = () => {
  const { t } = useLingui();

  return (
    <Paper
      aria-label={t`Loading leagues`}
      radius="md"
      role="status"
      shadow="sm"
    >
      <SkeletonToolbar />
      <Table.ScrollContainer minWidth={LEAGUE_TABLE_MIN_WIDTH}>
        <Table verticalSpacing="md">
          <Table.Thead>
            <SkeletonHeaderRow />
          </Table.Thead>
          <Table.Tbody>
            {Array.from({ length: LEAGUE_PAGE_SIZE }, (_, index) => (
              <SkeletonDataRow index={index} key={index} />
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <SkeletonFooter />
    </Paper>
  );
};
