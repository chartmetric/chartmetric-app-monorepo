import type {
  ArtistListQuery,
  ArtistSortBy,
  MetricDisplayMode,
  MetricSortFamily,
} from "./types";

export const ARTIST_PAGE_SIZE = 25;

export const METRIC_SORTS: Record<
  MetricSortFamily,
  Record<MetricDisplayMode, ArtistSortBy>
> = {
  cmScore: {
    change: "cmScoreChange",
    percentChange: "cmScoreChangePercent",
    total: "cmScore",
  },
  instagramFollowers: {
    change: "instagramFollowersChange",
    percentChange: "instagramFollowersChangePercent",
    total: "instagramFollowers",
  },
  tiktokFollowers: {
    change: "tiktokFollowersChange",
    percentChange: "tiktokFollowersChangePercent",
    total: "tiktokFollowers",
  },
};

const METRIC_SORT_FAMILIES: MetricSortFamily[] = [
  "cmScore",
  "instagramFollowers",
  "tiktokFollowers",
];

export const sortFamilyOf = (sortBy: ArtistSortBy): MetricSortFamily | null =>
  METRIC_SORT_FAMILIES.find((family) =>
    Object.values(METRIC_SORTS[family]).includes(sortBy),
  ) ?? null;

export const DEFAULT_ARTIST_QUERY = {
  changePeriod: "7d",
  limit: ARTIST_PAGE_SIZE,
  offset: 0,
  sortBy: "cmScore",
  sortDirection: "desc",
} satisfies ArtistListQuery;
