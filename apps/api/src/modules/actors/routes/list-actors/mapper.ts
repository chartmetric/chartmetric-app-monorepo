import type { PaginationQuery } from "../../../../lib/pagination.ts";
import type { ListActorsReply } from "./schemas.ts";
import type { ActorListRow } from "./types.ts";

import { toNumber } from "../../../../lib/numbers.ts";
import { emptyToNull } from "../../../../lib/strings.ts";

// The warehouse stores bare TMDB paths, but the public contract publishes
// absolute URLs like every other vertical's `imageUrl`. w185 is TMDB's
// profile-thumbnail rendition.
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w185";

const toImageUrl = (profilePath: string | null): string | null => {
  const path = emptyToNull(profilePath);
  return path === null ? null : `${TMDB_IMAGE_BASE_URL}${path}`;
};

type KnownForCredit = ListActorsReply["data"][number]["knownFor"][number];

const isKnownForTuple = (
  credit: unknown,
): credit is [number, number, string, string, string] =>
  Array.isArray(credit) &&
  typeof credit[0] === "number" &&
  typeof credit[1] === "number" &&
  typeof credit[2] === "string" &&
  typeof credit[3] === "string" &&
  typeof credit[4] === "string";

const toKnownFor = (value: string | null): KnownForCredit[] => {
  if (value === null) return [];

  let credits: unknown;
  try {
    credits = JSON.parse(value);
  } catch {
    return [];
  }
  if (!Array.isArray(credits)) return [];

  return credits
    .filter(isKnownForTuple)
    .map(([popularity, id, kind, character, name]) => ({
      character,
      id,
      kind,
      name,
      popularity,
    }));
};

export const toActorList = (
  actors: ActorListRow[],
  total: number,
  pagination: PaginationQuery,
): ListActorsReply => ({
  data: actors.map((actor) => ({
    id: actor.id,
    imageUrl: toImageUrl(actor.profile_path),
    instagramFollowers: toNumber(actor.instagram_followers),
    instagramHandle: emptyToNull(actor.instagram_handle),
    instagramUrl: emptyToNull(actor.instagram_url),
    knownFor: toKnownFor(actor.known_for),
    name: actor.name,
    popularity: actor.popularity,
    roleCount: toNumber(actor.role_count) ?? 0,
  })),
  meta: { limit: pagination.limit, offset: pagination.offset, total },
});
