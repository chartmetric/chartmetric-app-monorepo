import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { env } from "../../../env";

export type AccountRole = "admin" | "analyst" | "owner";

export interface ProductAccess {
  enabled: boolean;
  features?: Record<string, unknown>;
}

// Mirrors the /app/auth contract served by the api app's auth-service proxy;
// replace with the generated OpenAPI client types once that client exists.
export interface AccessContext {
  account: { id: string; role: AccountRole };
  products: Record<string, ProductAccess>;
  user: { id: string };
}

const fetchAccessContext = async (
  accessToken: string,
): Promise<AccessContext> => {
  const response = await fetch(new URL("/app/auth", env.apiUrl), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const errorCode = (body as { error?: string }).error;
    throw new Error(errorCode ?? `request_failed_${String(response.status)}`);
  }
  return body as AccessContext;
};

export const useAccessContext = (
  userId: string,
  accessToken: string,
): UseQueryResult<AccessContext> =>
  useQuery({
    queryFn: async () => await fetchAccessContext(accessToken),
    queryKey: ["access-context", userId],
  });
