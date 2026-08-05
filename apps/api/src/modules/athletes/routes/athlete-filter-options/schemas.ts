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

const SportsByLevelSchema = Type.Object({
  college: Type.Array(Type.String()),
  professional: Type.Array(Type.String()),
});

const StringListByKeySchema = Type.Record(
  Type.String(),
  Type.Array(Type.String()),
);

export const AthleteFilterOptionsReplySchema = Type.Object({
  // Teams are nested sport -> league -> teams so that, for example, the
  // Atlanta Dream and the Atlanta Hawks do not land in one flat basketball
  // bucket. A club whose league is unknown falls under "Other".
  clubsBySport: Type.Record(Type.String(), StringListByKeySchema),
  cmScore: CmScoreBoundsSchema,
  leaguesBySport: StringListByKeySchema,
  nationalities: Type.Array(FilterOptionSchema),
  sports: Type.Array(FilterOptionSchema),
  sportsByLevel: SportsByLevelSchema,
  types: Type.Array(FilterOptionSchema),
});

export type AthleteFilterOptionsReply = Static<
  typeof AthleteFilterOptionsReplySchema
>;
