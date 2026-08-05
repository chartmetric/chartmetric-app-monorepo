import type {
  CountryOptionRow,
  FollowerBoundsRow,
  GenreOptionRow,
} from "./queries.ts";
import type { ArtistFilterOptionsReply } from "./schemas.ts";

interface FilterOption {
  count: number;
  value: string;
}

const toSortedOptions = (
  rows: { count: number | string; value: string }[],
): FilterOption[] =>
  rows
    .map(({ count, value }) => ({ count: Number(count), value }))
    .toSorted((left, right) => {
      const countDifference = right.count - left.count;

      return countDifference === 0
        ? left.value.localeCompare(right.value)
        : countDifference;
    });

const toFollowerBounds = (
  rows: FollowerBoundsRow[],
): { max: number | null; min: number | null } => {
  const maxFollowers = rows[0]?.max_followers;

  return {
    max: maxFollowers === undefined ? null : Number(maxFollowers),
    min: 0,
  };
};

export const toArtistFilterOptions = (
  countryRows: CountryOptionRow[],
  genreRows: GenreOptionRow[],
  instagramBoundsRows: FollowerBoundsRow[],
  tiktokBoundsRows: FollowerBoundsRow[],
): ArtistFilterOptionsReply => ({
  countries: toSortedOptions(
    countryRows.map(({ code2, count }) => ({ count, value: code2 })),
  ),
  genres: toSortedOptions(
    genreRows.map(({ count, tag_slug: slug }) => ({ count, value: slug })),
  ),
  instagramFollowers: toFollowerBounds(instagramBoundsRows),
  tiktokFollowers: toFollowerBounds(tiktokBoundsRows),
});
