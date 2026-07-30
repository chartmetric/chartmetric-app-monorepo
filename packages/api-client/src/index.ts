import createClient, { type Client, type ClientOptions } from "openapi-fetch";

import type { paths } from "./schema.generated.ts";

export type * from "./schema.generated.ts";

export type ApiClient = Client<paths>;

export const createApiClient = (options: ClientOptions): ApiClient =>
  createClient<paths>(options);
