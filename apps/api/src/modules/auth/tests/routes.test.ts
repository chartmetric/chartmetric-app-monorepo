import type { FastifyInstance } from "fastify";

import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../../../app.ts";
import { stubClickhouse, testConfig } from "../../../tests/helpers.ts";

const accessContext = {
  account: { id: "org-1", role: "admin" },
  products: {
    chartmetric_app: { enabled: true },
    chartmetric_flow: { enabled: true, features: { sources: ["spotify"] } },
    onesheet: { enabled: false },
  },
  user: { id: "user-1" },
};

const jsonResponse = (body: unknown, status: number): Response =>
  Response.json(body, { status });

const buildTestApp = async (): Promise<FastifyInstance> =>
  await buildApp({ clickhouse: stubClickhouse(), config: testConfig });

describe("GET /app/auth", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("forwards the token and org header and returns the access context", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(accessContext, 200));
    vi.stubGlobal("fetch", fetchMock);
    const app = await buildTestApp();

    const response = await app.inject({
      headers: { authorization: "Bearer token-1", "x-org-id": "org-1" },
      method: "GET",
      url: "/app/auth",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(accessContext);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(
      "https://auth-service.invalid:3000/v1/auth/access-context",
    );
    expect(init.headers).toEqual({
      authorization: "Bearer token-1",
      "x-org-id": "org-1",
    });
    await app.close();
  });

  it("omits the org header upstream when the request has none", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(accessContext, 200));
    vi.stubGlobal("fetch", fetchMock);
    const app = await buildTestApp();

    await app.inject({
      headers: { authorization: "Bearer token-1" },
      method: "GET",
      url: "/app/auth",
    });

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(init.headers).toEqual({ authorization: "Bearer token-1" });
    await app.close();
  });

  it("returns 401 without calling the auth service when the token is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const app = await buildTestApp();

    const response = await app.inject({ method: "GET", url: "/app/auth" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: "unauthenticated",
      message: "Missing Authorization header.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    await app.close();
  });

  it("serves a cached context within two minutes and refetches after", async () => {
    vi.useFakeTimers({ now: 0, toFake: ["Date"] });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(accessContext, 200));
    vi.stubGlobal("fetch", fetchMock);
    const app = await buildTestApp();
    const request = {
      headers: { authorization: "Bearer token-1" },
      method: "GET",
      url: "/app/auth",
    } as const;

    await app.inject(request);
    const cachedResponse = await app.inject(request);

    expect(cachedResponse.statusCode).toBe(200);
    expect(cachedResponse.json()).toEqual(accessContext);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(2 * 60 * 1000 + 1);
    await app.inject(request);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    await app.close();
  });

  it("caches per requested org", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(accessContext, 200));
    vi.stubGlobal("fetch", fetchMock);
    const app = await buildTestApp();

    await app.inject({
      headers: { authorization: "Bearer token-1", "x-org-id": "org-1" },
      method: "GET",
      url: "/app/auth",
    });
    await app.inject({
      headers: { authorization: "Bearer token-1", "x-org-id": "org-2" },
      method: "GET",
      url: "/app/auth",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    await app.close();
  });

  it.each([
    [401, { error: "unauthenticated", message: "Invalid token." }],
    [
      403,
      {
        error: "no_org_membership",
        message: "The user has no resolvable organization.",
      },
    ],
  ])("passes through a %i without caching it", async (status, body) => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body, status));
    fetchMock.mockResolvedValueOnce(jsonResponse(body, status));
    vi.stubGlobal("fetch", fetchMock);
    const app = await buildTestApp();
    const request = {
      headers: { authorization: "Bearer bad-token" },
      method: "GET",
      url: "/app/auth",
    } as const;

    const first = await app.inject(request);
    const second = await app.inject(request);

    expect(first.statusCode).toBe(status);
    expect(first.json()).toEqual(body);
    expect(second.statusCode).toBe(status);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await app.close();
  });

  it("returns 502 when the auth service is unreachable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("connect refused"));
    vi.stubGlobal("fetch", fetchMock);
    const app = await buildTestApp();

    const response = await app.inject({
      headers: { authorization: "Bearer token-1" },
      method: "GET",
      url: "/app/auth",
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      error: "auth_service_unreachable",
      message: "Could not reach the auth service.",
    });
    await app.close();
  });

  it("returns 502 when a 200 body is not a valid access context", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ user: { id: "user-1" } }, 200));
    vi.stubGlobal("fetch", fetchMock);
    const app = await buildTestApp();

    const response = await app.inject({
      headers: { authorization: "Bearer token-1" },
      method: "GET",
      url: "/app/auth",
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      error: "auth_service_invalid_response",
      message: "The auth service returned an unexpected access context.",
    });
    await app.close();
  });

  it("stays out of the public OpenAPI spec", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const app = await buildTestApp();

    const response = await app.inject({ method: "GET", url: "/openapi.json" });
    const spec = response.json<{ paths: Record<string, unknown> }>();

    expect(Object.keys(spec.paths)).not.toContain("/app/auth");
    await app.close();
  });
});
