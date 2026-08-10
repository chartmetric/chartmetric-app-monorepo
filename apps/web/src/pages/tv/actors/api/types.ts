import type { GetQuery, GetReply } from "@repo/api-client";

// The SPA reads the session-authenticated /app surface; /v1 carries the same
// generated contract for API-key customers.
export type ActorListQuery = GetQuery<"/app/actors">;

export type ActorListReply = GetReply<"/app/actors">;

export type Actor = ActorListReply["data"][number];

export type KnownForCredit = Actor["knownFor"][number];

export type ActorSortBy = NonNullable<ActorListQuery["sortBy"]>;

export type ActorSortDirection = NonNullable<ActorListQuery["sortDirection"]>;
