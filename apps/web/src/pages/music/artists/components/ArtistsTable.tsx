import { useLingui } from "@lingui/react/macro";
import { Box, LoadingOverlay, Paper, Text } from "@mantine/core";
import { DataTable, type DataTableColumn } from "@repo/ui/data-table";
import { TablePagination } from "@repo/ui/table-pagination";
import { type FC, type ReactElement, useMemo } from "react";

import type {
  Artist,
  ArtistColumnConfig,
  ArtistColumnKey,
  ArtistSortBy,
  ArtistSortDirection,
  MetricDisplayMode,
  MetricSortFamily,
} from "../types";

import {
  type NumberFormatter,
  useAbbreviatedNumber,
} from "../../../../hooks/use-abbreviated-number";
import { useCountryName } from "../../../../lib/country-names";
import { EMPTY_CELL } from "../../../../lib/formatting";
import { ARTIST_PAGE_SIZE, METRIC_SORTS } from "../constants";
import { ArtistIdentity } from "./ArtistIdentity";

interface ArtistsTableProps {
  artists: Artist[];
  columnConfig: ArtistColumnConfig[];
  displayMode: MetricDisplayMode;
  isFetching: boolean;
  offset: number;
  onPageChange: (offset: number) => void;
  onSort: (sortBy: ArtistSortBy) => void;
  sortBy: ArtistSortBy;
  sortDirection: ArtistSortDirection;
}

interface ChangeValueProps {
  formatted: string;
  value: number;
}

const ChangeValue: FC<ChangeValueProps> = ({ formatted, value }) => {
  let color = "dimmed";
  if (value !== 0) color = value > 0 ? "teal.7" : "red.7";

  return (
    <Text c={color} component="span" fw={500} size="sm">
      {formatted}
    </Text>
  );
};

interface MetricCellValues {
  change: number | null;
  percent: number | null;
  total: number | null;
}

interface MetricFormatters {
  followers: NumberFormatter;
  followersChange: NumberFormatter;
  percent: NumberFormatter;
  score: NumberFormatter;
  scoreChange: NumberFormatter;
}

const useMetricFormatters = (): MetricFormatters => {
  const { i18n } = useLingui();
  const followers = useAbbreviatedNumber();
  const followersChange = useAbbreviatedNumber({ signed: true });

  return useMemo(() => {
    const percent = new Intl.NumberFormat(i18n.locale, {
      maximumFractionDigits: 1,
      signDisplay: "exceptZero",
      style: "percent",
    });
    const score = new Intl.NumberFormat(i18n.locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    });
    const scoreChange = new Intl.NumberFormat(i18n.locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
      signDisplay: "exceptZero",
    });

    return {
      followers,
      followersChange,
      percent: (value) => percent.format(value),
      score: (value) => score.format(value),
      scoreChange: (value) => scoreChange.format(value),
    };
  }, [followers, followersChange, i18n.locale]);
};

const renderMetricValue = (
  displayMode: MetricDisplayMode,
  values: MetricCellValues,
  totalFormatter: NumberFormatter,
  changeFormatter: NumberFormatter,
  percentFormatter: NumberFormatter,
): ReactElement => {
  if (displayMode === "total") {
    return (
      <>{values.total === null ? EMPTY_CELL : totalFormatter(values.total)}</>
    );
  }
  if (displayMode === "change") {
    return values.change === null ? (
      <>{EMPTY_CELL}</>
    ) : (
      <ChangeValue
        formatted={changeFormatter(values.change)}
        value={values.change}
      />
    );
  }
  return values.percent === null ? (
    <>{EMPTY_CELL}</>
  ) : (
    <ChangeValue
      formatted={percentFormatter(values.percent / 100)}
      value={values.percent}
    />
  );
};

const metricColumn = (
  family: MetricSortFamily,
  label: string,
  displayMode: MetricDisplayMode,
  values: (artist: Artist) => MetricCellValues,
  totalFormatter: NumberFormatter,
  changeFormatter: NumberFormatter,
  percentFormatter: NumberFormatter,
): DataTableColumn<Artist, ArtistSortBy> => ({
  align: "right",
  key: family,
  label,
  renderCell: (artist) =>
    renderMetricValue(
      displayMode,
      values(artist),
      totalFormatter,
      changeFormatter,
      percentFormatter,
    ),
  sortKey: METRIC_SORTS[family][displayMode],
});

const buildColumnRecord = (
  displayMode: MetricDisplayMode,
  formatters: MetricFormatters,
  formatCountry: (countryCode: string) => string,
  labels: Record<ArtistColumnKey, string>,
): Record<ArtistColumnKey, DataTableColumn<Artist, ArtistSortBy>> => ({
  artist: {
    key: "artist",
    label: labels.artist,
    renderCell: (artist) => (
      <ArtistIdentity
        artist={artist}
        countryName={
          artist.countryCode === null ? null : formatCountry(artist.countryCode)
        }
      />
    ),
    sortKey: "name",
  },
  cmScore: metricColumn(
    "cmScore",
    labels.cmScore,
    displayMode,
    (artist) => ({
      change: artist.cmScoreChange,
      percent: artist.cmScoreChangePercent,
      total: artist.cmScore,
    }),
    formatters.score,
    formatters.scoreChange,
    formatters.percent,
  ),
  instagramFollowers: metricColumn(
    "instagramFollowers",
    labels.instagramFollowers,
    displayMode,
    (artist) => ({
      change: artist.instagramFollowersChange,
      percent: artist.instagramFollowersChangePercent,
      total: artist.instagramFollowers,
    }),
    formatters.followers,
    formatters.followersChange,
    formatters.percent,
  ),
  tiktokFollowers: metricColumn(
    "tiktokFollowers",
    labels.tiktokFollowers,
    displayMode,
    (artist) => ({
      change: artist.tiktokFollowersChange,
      percent: artist.tiktokFollowersChangePercent,
      total: artist.tiktokFollowers,
    }),
    formatters.followers,
    formatters.followersChange,
    formatters.percent,
  ),
});

const useArtistTableColumns = (
  displayMode: MetricDisplayMode,
  columnConfig: ArtistColumnConfig[],
): DataTableColumn<Artist, ArtistSortBy>[] => {
  const { t } = useLingui();
  const formatters = useMetricFormatters();
  const formatCountry = useCountryName();

  const labels: Record<ArtistColumnKey, string> = useMemo(
    () => ({
      artist: t`Artist`,
      cmScore: t`CM score`,
      instagramFollowers: t`Instagram followers`,
      tiktokFollowers: t`TikTok followers`,
    }),
    [t],
  );

  return useMemo<DataTableColumn<Artist, ArtistSortBy>[]>(() => {
    const byKey = buildColumnRecord(
      displayMode,
      formatters,
      formatCountry,
      labels,
    );

    return columnConfig
      .filter((column) => column.visible)
      .map((column) => byKey[column.key]);
  }, [columnConfig, displayMode, formatCountry, formatters, labels]);
};

export const ArtistsTable: FC<ArtistsTableProps> = ({
  artists,
  columnConfig,
  displayMode,
  isFetching,
  offset,
  onPageChange,
  onSort,
  sortBy,
  sortDirection,
}) => {
  const { t } = useLingui();
  const columns = useArtistTableColumns(displayMode, columnConfig);

  const formatPageLabel = (page: number): string => {
    const currentPageText = String(page);

    return t({
      comment: "Current page number in the artists list",
      message: `Page ${currentPageText}`,
    });
  };

  return (
    <Paper radius="md" withBorder>
      <Box aria-busy={isFetching} pos="relative">
        <LoadingOverlay
          loaderProps={{ "aria-label": t`Updating artists` }}
          overlayProps={{ blur: 1 }}
          visible={isFetching}
          zIndex={2}
        />
        <DataTable
          ariaLabel={t`Artists`}
          columns={columns}
          getRowKey={(artist) => artist.id}
          onSort={onSort}
          rows={artists}
          sortBy={sortBy}
          sortDirection={sortDirection}
          sortLabel={(label) =>
            t({
              comment: "Accessible label for a sortable artists table column",
              message: `Sort by ${label}`,
            })
          }
        />
      </Box>
      <TablePagination
        hasNextPage={artists.length === ARTIST_PAGE_SIZE}
        isLoading={isFetching}
        loadingLabel={t`Updating artists`}
        nextLabel={t`Next`}
        offset={offset}
        onPageChange={onPageChange}
        pageLabel={formatPageLabel}
        pageSize={ARTIST_PAGE_SIZE}
        previousLabel={t`Previous`}
      />
    </Paper>
  );
};
