import { type TNull, type TSchema, type TUnion, Type } from "@sinclair/typebox";

export const Nullable = <Schema extends TSchema>(
  schema: Schema,
): TUnion<[Schema, TNull]> => Type.Union([schema, Type.Null()]);
