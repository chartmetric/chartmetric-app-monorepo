import createClient, { type Client, type ClientOptions } from "openapi-fetch";

import type { paths } from "./schema.generated.ts";

export type * from "./schema.generated.ts";

export type ApiClient = Client<paths>;

export const createApiClient = (options: ClientOptions): ApiClient =>
  createClient<paths>(options);

type GetOperation<Path extends keyof paths> = paths[Path] extends {
  get: infer Operation;
}
  ? Operation
  : never;

/**
 * The JSON body a GET returns on 200. Callers name the result for their own
 * feature — `type AthleteListReply = GetReply<"/app/athletes">` — so no consumer
 * walks into the generated schema by hand. Add a `Post*` pair when a route needs
 * one; nothing else about the shape belongs outside this package.
 */
export type GetReply<Path extends keyof paths> =
  GetOperation<Path> extends {
    responses: { 200: { content: { "application/json": infer Body } } };
  }
    ? Body
    : never;

export type GetQuery<Path extends keyof paths> =
  GetOperation<Path> extends {
    parameters: { query: infer Query };
  }
    ? Query
    : never;
