import { type Static, Type } from "@sinclair/typebox";

import { AgeGroupSchema } from "../list-influencers/schemas.ts";

// The allowed age-group buckets are the list route's request vocabulary; derive
// them from that contract so the two never drift, rather than restating them.
export const ALLOWED_AGE_GROUPS = AgeGroupSchema.anyOf.map(
  (literal) => literal.const,
);

const FilterOptionSchema = Type.Object({
  count: Type.Integer(),
  value: Type.String(),
});

export const InfluencerFilterOptionsReplySchema = Type.Object({
  ageGroups: Type.Array(FilterOptionSchema),
  categories: Type.Array(FilterOptionSchema),
  countries: Type.Array(FilterOptionSchema),
  genders: Type.Array(FilterOptionSchema),
});

export type InfluencerFilterOptionsReply = Static<
  typeof InfluencerFilterOptionsReplySchema
>;
