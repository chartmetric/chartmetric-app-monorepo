import { type Static, Type } from "@sinclair/typebox";

import { Nullable } from "../../../../lib/nullable.ts";

const FilterOptionSchema = Type.Object({
  count: Type.Integer(),
  value: Type.String(),
});

const FollowerBoundsSchema = Type.Object({
  max: Nullable(Type.Integer()),
  min: Nullable(Type.Integer()),
});

export const ArtistFilterOptionsReplySchema = Type.Object({
  countries: Type.Array(FilterOptionSchema),
  genres: Type.Array(FilterOptionSchema),
  instagramFollowers: FollowerBoundsSchema,
  tiktokFollowers: FollowerBoundsSchema,
});

export type ArtistFilterOptionsReply = Static<
  typeof ArtistFilterOptionsReplySchema
>;
