import { createApiClient } from "@repo/api-client";

import { env } from "../env";

export const apiClient = createApiClient({
  // Dev requests stay same-origin so Vite can proxy /app to API_PROXY_TARGET.
  baseUrl: import.meta.env.DEV ? "" : env.apiUrl,
});
