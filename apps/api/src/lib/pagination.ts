import { type Static, Type } from "@sinclair/typebox";

export const PaginationQuerySchema = Type.Object({
  limit: Type.Integer({ default: 50, maximum: 200, minimum: 1 }),
  offset: Type.Integer({ default: 0, minimum: 0 }),
});

export type PaginationQuery = Static<typeof PaginationQuerySchema>;

export const PaginationMetaSchema = Type.Object({
  limit: Type.Integer(),
  offset: Type.Integer(),
});
