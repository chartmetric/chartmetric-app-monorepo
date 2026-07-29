import {
  type Static,
  type TArray,
  type TInteger,
  type TObject,
  type TSchema,
  Type,
} from "@sinclair/typebox";

export const PaginationQuerySchema = Type.Object({
  limit: Type.Integer({ default: 50, maximum: 200, minimum: 1 }),
  offset: Type.Integer({ default: 0, minimum: 0 }),
});

export type PaginationQuery = Static<typeof PaginationQuerySchema>;

type TPaginatedReply<Item extends TSchema> = TObject<{
  data: TArray<Item>;
  meta: TObject<{ limit: TInteger; offset: TInteger }>;
}>;

export const paginatedReplySchema = <Item extends TSchema>(
  item: Item,
): TPaginatedReply<Item> =>
  Type.Object({
    data: Type.Array(item),
    meta: Type.Object({
      limit: Type.Integer(),
      offset: Type.Integer(),
    }),
  });
