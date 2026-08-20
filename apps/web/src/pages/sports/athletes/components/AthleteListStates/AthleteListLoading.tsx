import type { FC } from "react";

import { useLingui } from "@lingui/react/macro";
import { Group, Paper, Skeleton, Stack, Table } from "@mantine/core";
import {
  TABLE_FOOTER_PADDING,
  TABLE_TOOLBAR_PADDING,
  TABLE_VERTICAL_SPACING,
} from "@repo/ui/data-table";

import { ATHLETE_PAGE_SIZE } from "../../api/athlete-list";

const SkeletonToolbar: FC = () => (
  <Group justify="space-between" {...TABLE_TOOLBAR_PADDING}>
    <Skeleton
      height="calc(var(--mantine-font-size-xs) * var(--mantine-line-height-xs))"
      w={90}
    />
    <Skeleton height={30} radius="sm" w={104} />
  </Group>
);

const SkeletonFooter: FC = () => (
  <Group justify="space-between" {...TABLE_FOOTER_PADDING}>
    <Skeleton
      height="calc(var(--mantine-font-size-sm) * var(--mantine-line-height-sm))"
      w={180}
    />
    <Skeleton height={30} radius="sm" w={120} />
  </Group>
);

const SkeletonHeaderRow: FC = () => (
  <Table.Tr>
    <Table.Th w={64}>
      <Skeleton height={12} w={32} />
    </Table.Th>
    <Table.Th w={240}>
      <Skeleton height={12} w={120} />
    </Table.Th>
    <Table.Th miw={70}>
      <Skeleton height={12} w={28} />
    </Table.Th>
    <Table.Th miw={140}>
      <Skeleton height={12} w={72} />
    </Table.Th>
    <Table.Th miw={150}>
      <Skeleton height={12} w={90} />
    </Table.Th>
    <Table.Th miw={100}>
      <Skeleton height={12} w={68} />
    </Table.Th>
    <Table.Th miw={60}>
      <Skeleton height={12} ml="auto" w={26} />
    </Table.Th>
    <Table.Th miw={110}>
      <Skeleton height={12} w={58} />
    </Table.Th>
    <Table.Th miw={110}>
      <Skeleton height={12} ml="auto" w={62} />
    </Table.Th>
    <Table.Th miw={80}>
      <Skeleton height={12} ml="auto" w={36} />
    </Table.Th>
  </Table.Tr>
);

export const SkeletonDataRow: FC<{ index: number }> = ({ index }) => (
  <Table.Tr key={index}>
    <Table.Td w={64}>
      <Skeleton height={12} w={20} />
    </Table.Td>
    <Table.Td w={240}>
      <Group gap="sm" wrap="nowrap">
        <Skeleton circle height={40} />
        <Stack gap={2} style={{ flex: 1 }}>
          <Skeleton
            height="calc(var(--mantine-font-size-sm) * var(--mantine-line-height-sm))"
            w="75%"
          />
          <Skeleton
            height="calc(var(--mantine-font-size-sm) * var(--mantine-line-height-sm))"
            w="45%"
          />
          <Skeleton
            height="calc(var(--mantine-font-size-xs) * var(--mantine-line-height-xs))"
            mt={2}
            w={72}
          />
        </Stack>
      </Group>
    </Table.Td>
    <Table.Td miw={70}>
      <Skeleton height={12} w={24} />
    </Table.Td>
    <Table.Td miw={140}>
      <Skeleton height={12} w={90} />
    </Table.Td>
    <Table.Td miw={150}>
      <Skeleton height={12} w={110} />
    </Table.Td>
    <Table.Td miw={100}>
      <Skeleton height={12} w={76} />
    </Table.Td>
    <Table.Td miw={60}>
      <Skeleton height={12} ml="auto" w={22} />
    </Table.Td>
    <Table.Td miw={110}>
      <Skeleton height={12} w={70} />
    </Table.Td>
    <Table.Td miw={110}>
      <Skeleton height={12} ml="auto" w={52} />
    </Table.Td>
    <Table.Td miw={80}>
      <Skeleton height={12} ml="auto" w={34} />
    </Table.Td>
  </Table.Tr>
);

export const AthleteListLoading: FC = () => {
  const { t } = useLingui();

  return (
    <Paper
      aria-label={t`Loading athletes`}
      radius="md"
      role="status"
      shadow="sm"
    >
      <SkeletonToolbar />
      <Table.ScrollContainer minWidth={944}>
        <Table verticalSpacing={TABLE_VERTICAL_SPACING}>
          <Table.Thead>
            <SkeletonHeaderRow />
          </Table.Thead>
          <Table.Tbody>
            {Array.from({ length: ATHLETE_PAGE_SIZE }, (_, index) => (
              <SkeletonDataRow index={index} key={index} />
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <SkeletonFooter />
    </Paper>
  );
};
