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

export const ListAthletesQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  maxCmScore: Type.Optional(Type.Number()),
  minCmScore: Type.Optional(Type.Number()),
  name: OptionalTextFilter,
  nationality: OptionalTextFilter,
  sortBy: Type.Optional(
    Type.Union(AthleteSortBySchema.anyOf, { default: "cmScore" }),
  ),
  sortDirection: Type.Optional(
    Type.Union(SortDirectionSchema.anyOf, { default: "desc" }),
  ),
  sport: OptionalTextFilter,
  type: OptionalTextFilter,
});

export type ListAthletesQuery = Static<typeof ListAthletesQuerySchema>;
