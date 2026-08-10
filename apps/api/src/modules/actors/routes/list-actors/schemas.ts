import { type Static, Type } from "@sinclair/typebox";

import { Nullable } from "../../../../lib/nullable.ts";
import {
  PaginationMetaSchema,
  PaginationQuerySchema,
} from "../../../../lib/pagination.ts";

const ActorSortBySchema = Type.Union([
  Type.Literal("instagramFollowers"),
  Type.Literal("name"),
  Type.Literal("popularity"),
  Type.Literal("roleCount"),
]);

const SortDirectionSchema = Type.Union([
  Type.Literal("asc"),
  Type.Literal("desc"),
]);

export const ListActorsQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  sortBy: Type.Optional(
    Type.Union(ActorSortBySchema.anyOf, { default: "instagramFollowers" }),
  ),
  sortDirection: Type.Optional(
    Type.Union(SortDirectionSchema.anyOf, { default: "desc" }),
  ),
});

export type ListActorsQuery = Static<typeof ListActorsQuerySchema>;

const KnownForCreditSchema = Type.Object({
  character: Type.String(),
  id: Type.Integer(),
  kind: Type.String(),
  name: Type.String(),
  popularity: Type.Number(),
});

const ActorSchema = Type.Object({
  id: Type.Integer(),
  imageUrl: Nullable(Type.String()),
  instagramFollowers: Nullable(Type.Integer()),
  instagramHandle: Nullable(Type.String()),
  instagramUrl: Nullable(Type.String()),
  knownFor: Type.Array(KnownForCreditSchema, { maxItems: 2 }),
  name: Type.String(),
  popularity: Type.Number(),
  roleCount: Type.Integer(),
});

const ActorListMetaSchema = Type.Object({
  ...PaginationMetaSchema.properties,
  total: Type.Integer(),
});

export const ListActorsReplySchema = Type.Object({
  data: Type.Array(ActorSchema),
  meta: ActorListMetaSchema,
});

export type ListActorsReply = Static<typeof ListActorsReplySchema>;
