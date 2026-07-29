import { type Static, Type } from "@sinclair/typebox";

import { paginatedReplySchema } from "../../lib/pagination.ts";

const nullableString = Type.Union([Type.String(), Type.Null()]);

export const ArtistSchema = Type.Object({
  countryCode: nullableString,
  id: Type.Integer(),
  imageUrl: nullableString,
  name: Type.String(),
  recordLabel: nullableString,
});

export type Artist = Static<typeof ArtistSchema>;

export const ListArtistsReplySchema = paginatedReplySchema(ArtistSchema);

export type ListArtistsReply = Static<typeof ListArtistsReplySchema>;
