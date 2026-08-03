import { Value } from "@sinclair/typebox/value";
import fp from "fastify-plugin";
import { createHash } from "node:crypto";

import type { Config } from "../config.ts";

import {
  type AccessContext,
  AccessContextSchema,
  type AuthServiceError,
} from "../modules/auth/schemas.ts";

declare module "fastify" {
  interface FastifyInstance {
    authService: AuthServiceClient;
  }
}

export interface AccessContextRequest {
  authorization?: string | undefined;
  orgId?: string | undefined;
}

export type AuthServiceResult =
  | { body: AccessContext; status: 200 }
  | { body: AuthServiceError; status: 401 | 403 | 502 };

export interface AuthServiceClient {
  getAccessContext: (
    request: AccessContextRequest,
  ) => Promise<AuthServiceResult>;
}

const CACHE_TTL_MS = 2 * 60 * 1000;

interface ContextEntry {
  body: AccessContext;
  expiresAt: number;
}

interface TokenEntry {
  contextKey: string;
  expiresAt: number;
}

// Tokens are never stored or logged; the cache index uses their SHA-256 hash.
const tokenCacheKey = (
  authorization: string,
  orgId: string | undefined,
): string =>
  createHash("sha256")
    .update(`${authorization}\n${orgId ?? ""}`)
    .digest("hex");

const invalidResponse = (message: string): AuthServiceResult => ({
  body: { error: "auth_service_invalid_response", message },
  status: 502,
});

const fetchAccessContext = async (
  baseUrl: string,
  authorization: string,
  orgId: string | undefined,
): Promise<AuthServiceResult> => {
  const headers: Record<string, string> = { authorization };
  if (orgId !== undefined) {
    headers["x-org-id"] = orgId;
  }

  let response: Response;
  try {
    response = await fetch(new URL("/v1/auth/access-context", baseUrl), {
      headers,
    });
  } catch {
    return {
      body: {
        error: "auth_service_unreachable",
        message: "Could not reach the auth service.",
      },
      status: 502,
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return invalidResponse("The auth service returned a non-JSON response.");
  }

  if (response.status === 401 || response.status === 403) {
    return { body: body as AuthServiceError, status: response.status };
  }

  if (response.status !== 200) {
    return invalidResponse(
      `The auth service responded with status ${String(response.status)}.`,
    );
  }

  if (!Value.Check(AccessContextSchema, body)) {
    return invalidResponse(
      "The auth service returned an unexpected access context.",
    );
  }

  return { body, status: 200 };
};

export const createAuthServiceClient = (baseUrl: string): AuthServiceClient => {
  const contexts = new Map<string, ContextEntry>();
  const tokens = new Map<string, TokenEntry>();

  const pruneExpired = (now: number): void => {
    for (const [key, entry] of contexts) {
      if (entry.expiresAt <= now) {
        contexts.delete(key);
      }
    }
    for (const [key, entry] of tokens) {
      if (entry.expiresAt <= now) {
        tokens.delete(key);
      }
    }
  };

  const readCache = (
    tokenKey: string,
    now: number,
  ): AccessContext | undefined => {
    const tokenEntry = tokens.get(tokenKey);
    if (tokenEntry === undefined || tokenEntry.expiresAt <= now) {
      return undefined;
    }
    const contextEntry = contexts.get(tokenEntry.contextKey);
    if (contextEntry === undefined || contextEntry.expiresAt <= now) {
      return undefined;
    }
    return contextEntry.body;
  };

  const getAccessContext = async ({
    authorization,
    orgId,
  }: AccessContextRequest): Promise<AuthServiceResult> => {
    if (authorization === undefined || authorization === "") {
      return {
        body: {
          error: "unauthenticated",
          message: "Missing Authorization header.",
        },
        status: 401,
      };
    }

    const now = Date.now();
    const tokenKey = tokenCacheKey(authorization, orgId);
    const cached = readCache(tokenKey, now);
    if (cached !== undefined) {
      return { body: cached, status: 200 };
    }

    const result = await fetchAccessContext(baseUrl, authorization, orgId);
    if (result.status === 200) {
      pruneExpired(now);
      const expiresAt = now + CACHE_TTL_MS;
      const contextKey = `${result.body.user.id}:${result.body.account.id}`;
      contexts.set(contextKey, { body: result.body, expiresAt });
      tokens.set(tokenKey, { contextKey, expiresAt });
    }
    return result;
  };

  return { getAccessContext };
};

export interface AuthServicePluginOptions {
  config: Config;
}

export const authServicePlugin = fp<AuthServicePluginOptions>(
  (fastify, options, done) => {
    fastify.decorate(
      "authService",
      createAuthServiceClient(options.config.authServiceUrl),
    );
    done();
  },
  { name: "auth-service" },
);
