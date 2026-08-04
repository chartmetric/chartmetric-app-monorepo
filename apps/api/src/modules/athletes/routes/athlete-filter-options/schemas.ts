import { type Static, Type } from "@sinclair/typebox";

import { Nullable } from "../../../../lib/nullable.ts";

const FilterOptionSchema = Type.Object({
  count: Type.Integer(),
  value: Type.String(),
});

const CmScoreBoundsSchema = Type.Object({
  max: Nullable(Type.Number()),
  min: Nullable(Type.Number()),
});

export const AthleteFilterOptionsReplySchema = Type.Object({
  cmScore: CmScoreBoundsSchema,
  nationalities: Type.Array(FilterOptionSchema),
  sports: Type.Array(FilterOptionSchema),
  types: Type.Array(FilterOptionSchema),
});

export type AthleteFilterOptionsReply = Static<
  typeof AthleteFilterOptionsReplySchema
>;
