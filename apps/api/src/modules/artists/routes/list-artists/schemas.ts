import { type Static, Type } from "@sinclair/typebox";

import { Nullable } from "../../../../lib/nullable.ts";
import {
  PaginationMetaSchema,
  PaginationQuerySchema,
} from "../../../../lib/pagination.ts";

const ArtistSortBySchema = Type.Union([
  Type.Literal("name"),
  Type.Literal("countryCode"),
  Type.Literal("cmScore"),
  Type.Literal("instagramFollowers"),
  Type.Literal("tiktokFollowers"),
]);

const SortDirectionSchema = Type.Union([
  Type.Literal("asc"),
  Type.Literal("desc"),
]);

export const ListArtistsQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  sortBy: Type.Optional(
    Type.Union(ArtistSortBySchema.anyOf, { default: "cmScore" }),
  ),
  sortDirection: Type.Optional(
    Type.Union(SortDirectionSchema.anyOf, { default: "desc" }),
  ),
});

export type ListArtistsQuery = Static<typeof ListArtistsQuerySchema>;

const ArtistSchema = Type.Object({
  cmScore: Nullable(Type.Number()),
  countryCode: Nullable(Type.String()),
  id: Type.Integer(),
  imageUrl: Nullable(Type.String()),
  instagramFollowers: Nullable(Type.Integer()),
  isVerified: Type.Boolean(),
  name: Type.String(),
  recordLabel: Nullable(Type.String()),
  tiktokFollowers: Nullable(Type.Integer()),
});

export const ListArtistsReplySchema = Type.Object({
  data: Type.Array(ArtistSchema),
  meta: PaginationMetaSchema,
});

export type ListArtistsReply = Static<typeof ListArtistsReplySchema>;
