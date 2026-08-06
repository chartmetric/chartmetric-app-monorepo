import { type Static, Type } from "@sinclair/typebox";

import { Nullable } from "../../../../lib/nullable.ts";
import {
  PaginationMetaSchema,
  PaginationQuerySchema,
} from "../../../../lib/pagination.ts";

const AthleteSortBySchema = Type.Union([
  Type.Literal("cmScore"),
  Type.Literal("igFollowers"),
  Type.Literal("igPosts"),
  Type.Literal("name"),
  Type.Literal("nationality"),
  Type.Literal("rank"),
  Type.Literal("sport"),
  Type.Literal("tiktokFollowers"),
  Type.Literal("tiktokLikes"),
]);

export type AthleteSortBy = Static<typeof AthleteSortBySchema>;

const SortDirectionSchema = Type.Union([
  Type.Literal("asc"),
  Type.Literal("desc"),
]);

const AthleteLevelSchema = Type.Union([
  Type.Literal("college"),
  Type.Literal("professional"),
]);

export type AthleteLevelFilter = Static<typeof AthleteLevelSchema>;

const OptionalTextFilter = Type.Optional(
  Type.String({ maxLength: 100, minLength: 1 }),
);

const OptionalCategoricalFilter = Type.Optional(
  Type.Array(Type.String({ maxLength: 100, minLength: 1 }), {
    maxItems: 100,
    minItems: 1,
    uniqueItems: true,
  }),
);

export const ListAthletesQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  clubs: OptionalCategoricalFilter,
  excludeNationalities: OptionalCategoricalFilter,
  excludeSports: OptionalCategoricalFilter,
  leagues: OptionalCategoricalFilter,
  levels: Type.Optional(
    Type.Array(AthleteLevelSchema, {
      maxItems: 2,
      minItems: 1,
      uniqueItems: true,
    }),
  ),
  maxCmScore: Type.Optional(Type.Number()),
  maxFollowers: Type.Optional(Type.Integer({ minimum: 0 })),
  minCmScore: Type.Optional(Type.Number()),
  minFollowers: Type.Optional(Type.Integer({ minimum: 0 })),
  name: OptionalTextFilter,
  nationalities: OptionalCategoricalFilter,
  sortBy: Type.Optional(
    Type.Union(AthleteSortBySchema.anyOf, { default: "rank" }),
  ),
  // No default: the useful first look depends on the column. Metrics start
  // descending, names and rank ascending, so `sortBy=cmScore` alone returns the
  // best scores rather than the worst.
  sortDirection: Type.Optional(
    Type.Union(SortDirectionSchema.anyOf, {
      description:
        "Defaults to descending for metric columns and ascending for rank, name, nationality, sport and type.",
    }),
  ),
  sports: OptionalCategoricalFilter,
  verified: Type.Optional(Type.Boolean()),
});

export type ListAthletesQuery = Static<typeof ListAthletesQuerySchema>;

const SocialLinkSchema = Type.Object({
  handle: Type.String(),
  platform: Type.String(),
  url: Type.String(),
});

const AthleteSchema = Type.Object({
  age: Nullable(Type.Integer()),
  club: Nullable(Type.String()),
  cmScore: Nullable(Type.Number()),
  gpsAtk: Nullable(Type.Number()),
  gpsDef: Nullable(Type.Number()),
  gpsScore: Nullable(Type.Number()),
  id: Type.Integer(),
  igEngagementRate: Nullable(Type.Number()),
  igFollowers: Nullable(Type.Integer()),
  igPosts: Nullable(Type.Integer()),
  igVerified: Type.Boolean(),
  imageUrl: Nullable(Type.String()),
  lastMatchDate: Nullable(Type.String()),
  leagues: Type.Array(Type.String()),
  level: AthleteLevelSchema,
  momentumLabel: Nullable(Type.String()),
  momentumScore: Nullable(Type.Number()),
  name: Nullable(Type.String()),
  nationality: Nullable(Type.String()),
  nationalTeam: Nullable(Type.String()),
  position: Nullable(Type.String()),
  rank: Nullable(Type.Integer()),
  socialLinks: Type.Array(SocialLinkSchema),
  sport: Nullable(Type.String()),
  teamLogoUrl: Nullable(Type.String()),
  tiktokFollowers: Nullable(Type.Integer()),
  tiktokHearts: Nullable(Type.Integer()),
  tiktokLikes: Nullable(Type.Integer()),
  tiktokPosts: Nullable(Type.Integer()),
  tiktokVideos: Nullable(Type.Integer()),
  turnedPro: Nullable(Type.Integer()),
});

export type Athlete = Static<typeof AthleteSchema>;

const AthleteListMetaSchema = Type.Object({
  ...PaginationMetaSchema.properties,
  total: Type.Integer(),
});

export const ListAthletesReplySchema = Type.Object({
  data: Type.Array(AthleteSchema),
  meta: AthleteListMetaSchema,
});

export type ListAthletesReply = Static<typeof ListAthletesReplySchema>;
