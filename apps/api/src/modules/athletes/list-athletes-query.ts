import { type Static, Type } from "@sinclair/typebox";

import { PaginationQuerySchema } from "../../lib/pagination.ts";

const AthleteSortBySchema = Type.Union([
  Type.Literal("name"),
  Type.Literal("sport"),
  Type.Literal("nationality"),
  Type.Literal("type"),
  Type.Literal("cmScore"),
]);

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

export const ListAthletesQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  excludeNationalities: OptionalCategoricalFilter,
  excludeSports: OptionalCategoricalFilter,
  excludeTypes: OptionalCategoricalFilter,
  maxCmScore: Type.Optional(Type.Number()),
  minCmScore: Type.Optional(Type.Number()),
  name: OptionalTextFilter,
  nationalities: OptionalCategoricalFilter,
  sortBy: Type.Optional(
    Type.Union(AthleteSortBySchema.anyOf, { default: "cmScore" }),
  ),
  sortDirection: Type.Optional(
    Type.Union(SortDirectionSchema.anyOf, { default: "desc" }),
  ),
  sports: OptionalCategoricalFilter,
  types: OptionalCategoricalFilter,
});

export type ListAthletesQuery = Static<typeof ListAthletesQuerySchema>;
