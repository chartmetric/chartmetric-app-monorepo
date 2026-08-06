import type { createArtistFilterOptionsQueries } from "./queries.ts";

export interface FilterOption {
  count: number;
  value: string;
}

type ArtistFilterOptionsQueries = ReturnType<
  typeof createArtistFilterOptionsQueries
>;

export type CountryOptionRow = Awaited<
  ReturnType<
    ReturnType<ArtistFilterOptionsQueries["countryOptions"]>["execute"]
  >
>[number];
export type GenreOptionRow = Awaited<
  ReturnType<ReturnType<ArtistFilterOptionsQueries["genreOptions"]>["execute"]>
>[number];
export type FollowerBoundsRow = Awaited<
  ReturnType<
    ReturnType<ArtistFilterOptionsQueries["instagramFollowerBounds"]>["execute"]
  >
>[number];
