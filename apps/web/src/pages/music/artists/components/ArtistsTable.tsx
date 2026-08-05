import { useLingui } from "@lingui/react/macro";
import { Box, LoadingOverlay, Paper, Text } from "@mantine/core";
import { DataTable, type DataTableColumn } from "@repo/ui/data-table";
import { TablePagination } from "@repo/ui/table-pagination";
import { type FC, type ReactElement, useCallback, useMemo } from "react";

import type {
  Artist,
  ArtistSortBy,
  ArtistSortDirection,
  MetricDisplayMode,
  MetricSortFamily,
} from "../types";

import { ARTIST_PAGE_SIZE, METRIC_SORTS } from "../constants";
import { ArtistIdentity } from "./ArtistIdentity";

interface ArtistsTableProps {
  artists: Artist[];
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
  followers: Intl.NumberFormat;
  followersChange: Intl.NumberFormat;
  percent: Intl.NumberFormat;
  score: Intl.NumberFormat;
  scoreChange: Intl.NumberFormat;
}

const useMetricFormatters = (): MetricFormatters => {
  const { i18n } = useLingui();

  return useMemo(
    () => ({
      followers: new Intl.NumberFormat(i18n.locale, {
        compactDisplay: "short",
        maximumFractionDigits: 1,
        notation: "compact",
      }),
      followersChange: new Intl.NumberFormat(i18n.locale, {
        compactDisplay: "short",
        maximumFractionDigits: 1,
        notation: "compact",
        signDisplay: "exceptZero",
      }),
      percent: new Intl.NumberFormat(i18n.locale, {
        maximumFractionDigits: 1,
        signDisplay: "exceptZero",
        style: "percent",
      }),
      score: new Intl.NumberFormat(i18n.locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      }),
      scoreChange: new Intl.NumberFormat(i18n.locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
        signDisplay: "exceptZero",
      }),
    }),
    [i18n.locale],
  );
};

const renderMetricValue = (
  displayMode: MetricDisplayMode,
  values: MetricCellValues,
  totalFormatter: Intl.NumberFormat,
  changeFormatter: Intl.NumberFormat,
  percentFormatter: Intl.NumberFormat,
): ReactElement => {
  if (displayMode === "total") {
    return (
      <>{values.total === null ? "—" : totalFormatter.format(values.total)}</>
    );
  }
  if (displayMode === "change") {
    return values.change === null ? (
      <>—</>
    ) : (
      <ChangeValue
        formatted={changeFormatter.format(values.change)}
        value={values.change}
      />
    );
  }
  return values.percent === null ? (
    <>—</>
  ) : (
    <ChangeValue
      formatted={percentFormatter.format(values.percent / 100)}
      value={values.percent}
    />
  );
};

const metricColumn = (
  family: MetricSortFamily,
  label: string,
  displayMode: MetricDisplayMode,
  values: (artist: Artist) => MetricCellValues,
  totalFormatter: Intl.NumberFormat,
  changeFormatter: Intl.NumberFormat,
  percentFormatter: Intl.NumberFormat,
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

const useArtistTableColumns = (
  displayMode: MetricDisplayMode,
): DataTableColumn<Artist, ArtistSortBy>[] => {
  const { i18n, t } = useLingui();
  const formatters = useMetricFormatters();
  const countryFormatter = useMemo(
    () => new Intl.DisplayNames([i18n.locale], { type: "region" }),
    [i18n.locale],
  );
  const formatCountry = useCallback(
    (countryCode: string): string => {
      try {
        return countryFormatter.of(countryCode) ?? countryCode;
      } catch {
        return countryCode;
      }
    },
    [countryFormatter],
  );

  return useMemo<DataTableColumn<Artist, ArtistSortBy>[]>(
    () => [
      {
        key: "artist",
        label: t`Artist`,
        renderCell: (artist) => (
          <ArtistIdentity
            artist={artist}
            countryName={
              artist.countryCode === null
                ? null
                : formatCountry(artist.countryCode)
            }
          />
        ),
        sortKey: "name",
      },
      metricColumn(
        "cmScore",
        t`CM score`,
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
      metricColumn(
        "instagramFollowers",
        t`Instagram followers`,
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
      metricColumn(
        "tiktokFollowers",
        t`TikTok followers`,
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
    ],
    [displayMode, formatCountry, formatters, t],
  );
};

export const ArtistsTable: FC<ArtistsTableProps> = ({
  artists,
  displayMode,
  isFetching,
  offset,
  onPageChange,
  onSort,
  sortBy,
  sortDirection,
}) => {
  const { t } = useLingui();
  const columns = useArtistTableColumns(displayMode);

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
