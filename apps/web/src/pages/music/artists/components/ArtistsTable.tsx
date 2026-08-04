import { faBadgeCheck } from "@fortawesome/pro-solid-svg-icons/faBadgeCheck";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLingui } from "@lingui/react/macro";
import { Avatar, Box, Group, LoadingOverlay, Paper, Text } from "@mantine/core";
import { DataTable, type DataTableColumn } from "@repo/ui/data-table";
import { TablePagination } from "@repo/ui/table-pagination";
import { type FC, useMemo } from "react";

import {
  type Artist,
  ARTIST_PAGE_SIZE,
  type ArtistSortBy,
  type ArtistSortDirection,
} from "../artist-list-query";

interface ArtistsTableProps {
  artists: Artist[];
  isFetching: boolean;
  offset: number;
  onPageChange: (offset: number) => void;
  onSort: (sortBy: ArtistSortBy) => void;
  sortBy: ArtistSortBy;
  sortDirection: ArtistSortDirection;
}

interface ArtistIdentityProps {
  artist: Artist;
  countryName: string | null;
}

const ArtistIdentity: FC<ArtistIdentityProps> = ({ artist, countryName }) => {
  const { t } = useLingui();

  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar alt={artist.name} name={artist.name} src={artist.imageUrl} />
      <div>
        <Group align="center" gap={4} wrap="nowrap">
          <Text fw={600}>{artist.name}</Text>
          {artist.isVerified ? (
            <FontAwesomeIcon
              aria-label={t`Verified artist`}
              color="var(--mantine-color-blue-6)"
              icon={faBadgeCheck}
              role="img"
            />
          ) : null}
        </Group>
        {countryName === null ? null : (
          <Text c="dimmed" size="xs">
            {countryName}
          </Text>
        )}
      </div>
    </Group>
  );
};

const useArtistTableColumns = (): DataTableColumn<Artist, ArtistSortBy>[] => {
  const { i18n, t } = useLingui();
  const countryFormatter = useMemo(
    () => new Intl.DisplayNames([i18n.locale], { type: "region" }),
    [i18n.locale],
  );
  const scoreFormatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      }),
    [i18n.locale],
  );
  const followersFormatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.locale, {
        compactDisplay: "short",
        maximumFractionDigits: 1,
        notation: "compact",
      }),
    [i18n.locale],
  );

  return useMemo<DataTableColumn<Artist, ArtistSortBy>[]>(() => {
    const formatCountry = (countryCode: string): string => {
      try {
        return countryFormatter.of(countryCode) ?? countryCode;
      } catch {
        return countryCode;
      }
    };

    return [
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
      {
        align: "right",
        key: "cmScore",
        label: t`CM score`,
        renderCell: (artist) =>
          artist.cmScore === null ? "—" : scoreFormatter.format(artist.cmScore),
        sortKey: "cmScore",
      },
      {
        align: "right",
        key: "instagramFollowers",
        label: t`Instagram followers`,
        renderCell: (artist) =>
          artist.instagramFollowers === null
            ? "—"
            : followersFormatter.format(artist.instagramFollowers),
        sortKey: "instagramFollowers",
      },
      {
        align: "right",
        key: "tiktokFollowers",
        label: t`TikTok followers`,
        renderCell: (artist) =>
          artist.tiktokFollowers === null
            ? "—"
            : followersFormatter.format(artist.tiktokFollowers),
        sortKey: "tiktokFollowers",
      },
    ];
  }, [countryFormatter, followersFormatter, scoreFormatter, t]);
};

export const ArtistsTable: FC<ArtistsTableProps> = ({
  artists,
  isFetching,
  offset,
  onPageChange,
  onSort,
  sortBy,
  sortDirection,
}) => {
  const { t } = useLingui();
  const columns = useArtistTableColumns();

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
