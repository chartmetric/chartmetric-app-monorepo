import type { PaginationQuery } from "../../lib/pagination.ts";
import type { AthleteRow } from "./queries.ts";

import { defineApiResponse } from "../../lib/api-response.ts";

const emptyToNull = (value: string | null): string | null =>
  value === null || value === "" ? null : value;

type AthleteListMapper = (
  athletes: AthleteRow[],
  pagination: PaginationQuery,
) => unknown;

export const toAthleteList = ((athletes, pagination) => ({
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
})) satisfies AthleteListMapper;

export const ListAthletes = defineApiResponse(toAthleteList);
