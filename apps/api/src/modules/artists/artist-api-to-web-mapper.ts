import type { PaginationQuery } from "../../lib/pagination.ts";
import type { ArtistRow, ProfileRow } from "./queries.ts";
import type { ListArtistsReply } from "./schemas.ts";

const emptyToNull = (value: string): string | null =>
  value === "" ? null : value;

export const toArtistList = (
  artists: ArtistRow[],
  profiles: ProfileRow[],
  pagination: PaginationQuery,
): ListArtistsReply => {
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
};
