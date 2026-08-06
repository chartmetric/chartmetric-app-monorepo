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
  Type.Literal("cmScoreChange"),
  Type.Literal("cmScoreChangePercent"),
  Type.Literal("instagramFollowers"),
  Type.Literal("instagramFollowersChange"),
  Type.Literal("instagramFollowersChangePercent"),
  Type.Literal("tiktokFollowers"),
  Type.Literal("tiktokFollowersChange"),
  Type.Literal("tiktokFollowersChangePercent"),
]);

const SortDirectionSchema = Type.Union([
  Type.Literal("asc"),
  Type.Literal("desc"),
]);

const ChangePeriodSchema = Type.Union([
  Type.Literal("1d"),
  Type.Literal("7d"),
  Type.Literal("28d"),
]);

const OptionalCategoricalFilter = Type.Optional(
  Type.Array(Type.String({ maxLength: 100, minLength: 1 }), {
    maxItems: 100,
    minItems: 1,
    uniqueItems: true,
  }),
);

const OptionalFollowerBound = Type.Optional(Type.Integer({ minimum: 0 }));

export const ListArtistsQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  changePeriod: Type.Optional(
    Type.Union(ChangePeriodSchema.anyOf, { default: "7d" }),
  ),
  countries: OptionalCategoricalFilter,
  excludeCountries: OptionalCategoricalFilter,
  excludeGenres: OptionalCategoricalFilter,
  genres: OptionalCategoricalFilter,
  maxInstagramFollowers: OptionalFollowerBound,
  maxTiktokFollowers: OptionalFollowerBound,
  minInstagramFollowers: OptionalFollowerBound,
  minTiktokFollowers: OptionalFollowerBound,
  sortBy: Type.Optional(
    Type.Union(ArtistSortBySchema.anyOf, { default: "cmScore" }),
  ),
  sortDirection: Type.Optional(
    Type.Union(SortDirectionSchema.anyOf, { default: "desc" }),
  ),
  verifiedOnly: Type.Optional(Type.Boolean()),
});

export type ListArtistsQuery = Static<typeof ListArtistsQuerySchema>;

const ArtistSchema = Type.Object({
  cmScore: Nullable(Type.Number()),
  cmScoreChange: Nullable(Type.Number()),
  cmScoreChangePercent: Nullable(Type.Number()),
  countryCode: Nullable(Type.String()),
  id: Type.Integer(),
  imageUrl: Nullable(Type.String()),
  instagramFollowers: Nullable(Type.Integer()),
  instagramFollowersChange: Nullable(Type.Integer()),
  instagramFollowersChangePercent: Nullable(Type.Number()),
  isVerified: Type.Boolean(),
  name: Type.String(),
  recordLabel: Nullable(Type.String()),
  tiktokFollowers: Nullable(Type.Integer()),
  tiktokFollowersChange: Nullable(Type.Integer()),
  tiktokFollowersChangePercent: Nullable(Type.Number()),
});

export const ListArtistsReplySchema = Type.Object({
  data: Type.Array(ArtistSchema),
  meta: PaginationMetaSchema,
});

export type ListArtistsReply = Static<typeof ListArtistsReplySchema>;
