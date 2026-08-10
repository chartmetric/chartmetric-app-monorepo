import type { ActorListQuery, ActorListReply } from "./types";

import { apiClient } from "../../../../api/client";

export const ACTOR_PAGE_SIZE = 25;

export const DEFAULT_ACTOR_QUERY = {
  limit: ACTOR_PAGE_SIZE,
  offset: 0,
  sortBy: "instagramFollowers",
  sortDirection: "desc",
} satisfies ActorListQuery;

export const loadActors = async (
  query: ActorListQuery,
): Promise<ActorListReply> => {
  const result = await apiClient.GET("/app/actors", { params: { query } });

  if (result.data === undefined) {
    throw new Error("Actor request failed");
  }

  return result.data;
};
