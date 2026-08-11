import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { faInstagram } from "@fortawesome/free-brands-svg-icons/faInstagram";
import { faTiktok } from "@fortawesome/free-brands-svg-icons/faTiktok";
import { faYoutube } from "@fortawesome/free-brands-svg-icons/faYoutube";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import {
  Badge,
  Box,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { DataTable, type DataTableColumn } from "@repo/ui/data-table";
import { TablePagination } from "@repo/ui/table-pagination";
import { type FC, useMemo } from "react";

import type { Influencer, InfluencerSortBy } from "../types";

import { useCountryName } from "../../../../lib/country-names";
import { EMPTY_CELL } from "../../../../lib/formatting";
import { DEFAULT_INFLUENCER_SORT_BY, INFLUENCER_PAGE_SIZE } from "../constants";
import { useInfluencerValueLabels } from "../hooks/use-influencer-value-labels";
import { InfluencerIdentity } from "./InfluencerIdentity";

interface InfluencersTableProps {
  influencers: Influencer[];
  isFetching: boolean;
  offset: number;
  onPageChange: (offset: number) => void;
  total: number | undefined;
}

// Derived so a handle field added to the reply forces a label — and therefore
// a decision about the new platform — rather than being dropped silently.
type HandleKey = Extract<keyof Influencer, `${string}Handle`>;

const HANDLE_PLATFORMS: readonly {
  icon: IconDefinition;
  key: HandleKey;
}[] = [
  { icon: faInstagram, key: "instagramHandle" },
  { icon: faTiktok, key: "tiktokHandle" },
  { icon: faYoutube, key: "youtubeHandle" },
];

const TagList: FC<{ tags: string[] }> = ({ tags }) =>
  tags.length === 0 ? (
    <>{EMPTY_CELL}</>
  ) : (
    <Group gap={4}>
      {tags.map((tag) => (
        <Badge key={tag} variant="light">
          {tag}
        </Badge>
      ))}
    </Group>
  );

interface InfluencerHandlesProps {
  influencer: Influencer;
  labels: Record<HandleKey, string>;
}

const InfluencerHandles: FC<InfluencerHandlesProps> = ({
  influencer,
  labels,
}) => {
  const handles = HANDLE_PLATFORMS.map((platform) => ({
    ...platform,
    handle: influencer[platform.key],
  })).filter((platform) => platform.handle !== null);

  if (handles.length === 0) return <>{EMPTY_CELL}</>;

  return (
    <Stack gap={2}>
      {handles.map((platform) => (
        <Group gap={6} key={platform.key} wrap="nowrap">
          <FontAwesomeIcon
            aria-label={labels[platform.key]}
            icon={platform.icon}
            role="img"
          />
          <Text size="sm">@{platform.handle}</Text>
        </Group>
      ))}
    </Stack>
  );
};

interface InfluencerLocationProps {
  city: string | null;
  countryName: string | null;
}

const InfluencerLocation: FC<InfluencerLocationProps> = ({
  city,
  countryName,
}) => {
  const primary = countryName ?? city;
  if (primary === null) return <>{EMPTY_CELL}</>;

  const secondary = countryName === null ? null : city;

  return (
    <div>
      <Text size="sm">{primary}</Text>
      {secondary === null ? null : (
        <Text c="dimmed" size="xs">
          {secondary}
        </Text>
      )}
    </div>
  );
};

const useInfluencerColumns = (): DataTableColumn<
  Influencer,
  InfluencerSortBy
>[] => {
  const { t } = useLingui();
  const formatCountry = useCountryName();
  const { formatAgeGroup, formatGender } = useInfluencerValueLabels();

  return useMemo<DataTableColumn<Influencer, InfluencerSortBy>[]>(() => {
    const handleLabels: Record<HandleKey, string> = {
      instagramHandle: t`Instagram`,
      tiktokHandle: t`TikTok`,
      youtubeHandle: t`YouTube`,
    };

    return [
      {
        key: "influencer",
        label: t`Influencer`,
        renderCell: (influencer) => (
          <InfluencerIdentity name={influencer.name} />
        ),
      },
      {
        key: "categories",
        label: t`Categories`,
        renderCell: (influencer) => <TagList tags={influencer.categories} />,
      },
      {
        key: "subtags",
        label: t`Subtags`,
        renderCell: (influencer) => <TagList tags={influencer.subtags} />,
      },
      {
        key: "handles",
        label: t`Handles`,
        renderCell: (influencer) => (
          <InfluencerHandles influencer={influencer} labels={handleLabels} />
        ),
      },
      {
        key: "location",
        label: t`Location`,
        renderCell: (influencer) => (
          <InfluencerLocation
            city={influencer.city}
            countryName={
              influencer.country === null
                ? null
                : formatCountry(influencer.country)
            }
          />
        ),
      },
      {
        key: "gender",
        label: t`Gender`,
        renderCell: (influencer) =>
          influencer.gender === null
            ? EMPTY_CELL
            : formatGender(influencer.gender),
      },
      {
        key: "ageGroup",
        label: t`Age`,
        renderCell: (influencer) =>
          influencer.ageGroup === null
            ? EMPTY_CELL
            : formatAgeGroup(influencer.ageGroup),
      },
    ];
  }, [formatAgeGroup, formatCountry, formatGender, t]);
};

export const InfluencersTable: FC<InfluencersTableProps> = ({
  influencers,
  isFetching,
  offset,
  onPageChange,
  total,
}) => {
  const { t } = useLingui();
  const columns = useInfluencerColumns();

  const formatPageLabel = (page: number, pageCount?: number): string => {
    const currentPageText = String(page);

    if (pageCount === undefined) {
      return t({
        comment: "Current page number in the influencers list",
        message: `Page ${currentPageText}`,
      });
    }

    const pageCountText = String(pageCount);

    return t({
      comment:
        "Current page number and total page count in the influencers list",
      message: `Page ${currentPageText} of ${pageCountText}`,
    });
  };

  return (
    <Paper radius="md" withBorder>
      <Box aria-busy={isFetching} pos="relative">
        <LoadingOverlay
          loaderProps={{ "aria-label": t`Updating influencers` }}
          overlayProps={{ blur: 1 }}
          visible={isFetching}
          zIndex={2}
        />
        <DataTable
          ariaLabel={t`Influencers`}
          columns={columns}
          getRowKey={(influencer) => influencer.id}
          onSort={() => {
            // No column declares a sortKey, so DataTable never invokes this.
          }}
          rows={influencers}
          sortBy={DEFAULT_INFLUENCER_SORT_BY}
          sortDirection="asc"
          sortLabel={(label) => label}
        />
      </Box>
      <TablePagination
        hasNextPage={influencers.length === INFLUENCER_PAGE_SIZE}
        isLoading={isFetching}
        loadingLabel={t`Updating influencers`}
        nextLabel={t`Next`}
        offset={offset}
        onPageChange={onPageChange}
        pageLabel={formatPageLabel}
        pageSize={INFLUENCER_PAGE_SIZE}
        previousLabel={t`Previous`}
        {...(total === undefined ? {} : { total })}
      />
    </Paper>
  );
};
