import type { PaginationQuery } from "../../../../lib/pagination.ts";
import type { AthleteRow } from "./queries.ts";
import type { ListAthletesReply } from "./schemas.ts";

const emptyToNull = (value: string | null): string | null =>
  value === null || value === "" ? null : value;

export const toAthleteList = (
  athletes: AthleteRow[],
  pagination: PaginationQuery,
): ListAthletesReply => ({
  data: athletes.map((athlete) => ({
    cmScore: athlete.cm_score,
    id: athlete.profile_id,
    imageUrl: emptyToNull(athlete.image_url),
    name: emptyToNull(athlete.name),
    nationality: emptyToNull(athlete.nationality),
    sport: emptyToNull(athlete.sport),
    type: emptyToNull(athlete.type),
  })),
  meta: {
    limit: pagination.limit,
    offset: pagination.offset,
  },
});
