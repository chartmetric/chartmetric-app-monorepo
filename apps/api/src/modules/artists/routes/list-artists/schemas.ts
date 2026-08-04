import { type Static, Type } from "@sinclair/typebox";

import { Nullable } from "../../../../lib/nullable.ts";
import { PaginationMetaSchema } from "../../../../lib/pagination.ts";

const ArtistSchema = Type.Object({
  countryCode: Nullable(Type.String()),
  id: Type.Integer(),
  imageUrl: Nullable(Type.String()),
  name: Type.String(),
  recordLabel: Nullable(Type.String()),
});

export const ListArtistsReplySchema = Type.Object({
  data: Type.Array(ArtistSchema),
  meta: PaginationMetaSchema,
});

export type ListArtistsReply = Static<typeof ListArtistsReplySchema>;
