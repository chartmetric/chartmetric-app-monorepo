import { type Static, Type } from "@sinclair/typebox";

import { Nullable } from "../../../../lib/nullable.ts";
import {
  PaginationMetaSchema,
  PaginationQuerySchema,
} from "../../../../lib/pagination.ts";

const LeagueSortBySchema = Type.Union([
  Type.Literal("name"),
  Type.Literal("sport"),
  Type.Literal("trackedAthletes"),
]);

export type LeagueSortBy = Static<typeof LeagueSortBySchema>;

const SportFilterSchema = Type.String({ maxLength: 100, minLength: 1 });

export const ListLeaguesQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  megaOnly: Type.Optional(
    Type.Boolean({
      description:
        "Keep only leagues with at least one tracked athlete above 100M Instagram followers.",
    }),
  ),
  minAggregatedIgFollowers: Type.Optional(Type.Integer({ minimum: 0 })),
  minTrackedAthletes: Type.Optional(Type.Integer({ minimum: 0 })),
  name: Type.Optional(Type.String({ maxLength: 100, minLength: 1 })),
  sortBy: Type.Optional(
    Type.Union(LeagueSortBySchema.anyOf, { default: "name" }),
  ),
  sports: Type.Optional(
    Type.Array(SportFilterSchema, {
      maxItems: 20,
      minItems: 1,
      uniqueItems: true,
    }),
  ),
});

export type ListLeaguesQuery = Static<typeof ListLeaguesQuerySchema>;

const KeyAthleteSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String(),
});

const LeagueSchema = Type.Object({
  country: Nullable(Type.String()),
  countryFlagUrl: Nullable(Type.String()),
  // `leagues.id` is a UInt64 well past the range JSON numbers represent
  // exactly, so the identifier travels as a string.
  id: Type.String(),
  keyAthletes: Type.Array(KeyAthleteSchema),
  leagueType: Nullable(Type.String()),
  logoUrl: Nullable(Type.String()),
  name: Nullable(Type.String()),
  nationalities: Type.Array(Type.String()),
  sport: Nullable(Type.String()),
  trackedAthletes: Type.Integer(),
});

export type League = Static<typeof LeagueSchema>;

const LeagueListMetaSchema = Type.Object({
  ...PaginationMetaSchema.properties,
  total: Type.Integer(),
});

export const ListLeaguesReplySchema = Type.Object({
  data: Type.Array(LeagueSchema),
  meta: LeagueListMetaSchema,
});

export type ListLeaguesReply = Static<typeof ListLeaguesReplySchema>;
