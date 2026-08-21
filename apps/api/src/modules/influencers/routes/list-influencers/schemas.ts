import { type Static, Type } from "@sinclair/typebox";

import { Nullable } from "../../../../lib/nullable.ts";
import {
  PaginationMetaSchema,
  PaginationQuerySchema,
} from "../../../../lib/pagination.ts";

const SortDirectionSchema = Type.Union([
  Type.Literal("asc"),
  Type.Literal("desc"),
]);

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

// The six supported buckets. The source table also carries overlapping
// data-quality values (18-34, 25-44, …) that this contract rejects.
const AgeGroupSchema = Type.Union([
  Type.Literal("18-"),
  Type.Literal("18-24"),
  Type.Literal("25-34"),
  Type.Literal("35-44"),
  Type.Literal("45-64"),
  Type.Literal("65+"),
]);

const OptionalAgeGroupFilter = Type.Optional(
  Type.Array(AgeGroupSchema, {
    maxItems: 6,
    minItems: 1,
    uniqueItems: true,
  }),
);

export const ListInfluencersQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  ageGroups: OptionalAgeGroupFilter,
  categories: OptionalCategoricalFilter,
  countries: OptionalCategoricalFilter,
  excludeAgeGroups: OptionalAgeGroupFilter,
  excludeCategories: OptionalCategoricalFilter,
  excludeCountries: OptionalCategoricalFilter,
  excludeGenders: OptionalCategoricalFilter,
  genders: OptionalCategoricalFilter,
  handle: OptionalTextFilter,
  sortBy: Type.Optional(Type.Literal("name", { default: "name" })),
  sortDirection: Type.Optional(
    Type.Union(SortDirectionSchema.anyOf, { default: "asc" }),
  ),
});

export type ListInfluencersQuery = Static<typeof ListInfluencersQuerySchema>;

const InfluencerSchema = Type.Object({
  ageGroup: Nullable(Type.String()),
  categories: Type.Array(Type.String()),
  city: Nullable(Type.String()),
  country: Nullable(Type.String()),
  gender: Nullable(Type.String()),
  id: Type.Integer(),
  instagramHandle: Nullable(Type.String()),
  name: Nullable(Type.String()),
  subtags: Type.Array(Type.String()),
  tiktokHandle: Nullable(Type.String()),
  youtubeHandle: Nullable(Type.String()),
});

export const ListInfluencersReplySchema = Type.Object({
  data: Type.Array(InfluencerSchema),
  meta: PaginationMetaSchema,
});

export type ListInfluencersReply = Static<typeof ListInfluencersReplySchema>;
