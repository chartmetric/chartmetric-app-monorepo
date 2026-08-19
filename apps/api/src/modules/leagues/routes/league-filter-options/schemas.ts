import { type Static, Type } from "@sinclair/typebox";

export const LeagueFilterOptionsReplySchema = Type.Object({
  sports: Type.Array(Type.String()),
});

export type LeagueFilterOptionsReply = Static<
  typeof LeagueFilterOptionsReplySchema
>;
