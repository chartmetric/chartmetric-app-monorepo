import type { PaginationQuery } from "../../lib/pagination.ts";
import type { ArtistRow, ProfileRow } from "./queries.ts";

const emptyToNull = (value: string): string | null =>
  value === "" ? null : value;

type ArtistListMapper = (
  artists: ArtistRow[],
  profiles: ProfileRow[],
  pagination: PaginationQuery,
) => unknown;

export const toArtistList = ((artists, profiles, pagination) => {
  const profilesBySourceId = new Map(
    profiles
      .filter((profile) => profile.source_id !== null)
      .map((profile) => [Number(profile.source_id), profile]),
  );

  return {
    data: artists.map((artist) => {
      const profile = profilesBySourceId.get(artist.id);

      return {
        countryCode: emptyToNull(artist.code2),
        id: artist.id,
        imageUrl:
          emptyToNull(profile?.image_url ?? "") ??
          emptyToNull(artist.image_url),
        name: emptyToNull(profile?.name ?? "") ?? artist.name,
        recordLabel: emptyToNull(artist.record_label),
      };
    }),
    meta: {
      limit: pagination.limit,
      offset: pagination.offset,
    },
  };
}) satisfies ArtistListMapper;

export type ListArtistsReply = ReturnType<typeof toArtistList>;
