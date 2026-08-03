import { createApiClient } from "@repo/api-client";

export const apiClient = createApiClient({
  baseUrl: import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL ?? ""),
  credentials: "include",
});
