import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, setSessionExpiredHandler } from "../apiClient";
import { ApiError } from "../../types/api";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Queues the two fetch calls one 401-that-fails-to-refresh produces: the
 * original request, then the `/auth/refresh` attempt (which also fails). */
function queueExpiredSessionAttempt(fetchMock: ReturnType<typeof vi.fn>): void {
  fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: "Unauthorized" }));
  fetchMock.mockResolvedValueOnce(jsonResponse(401, {}));
}

describe("apiRequest session-expiry handling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Also resets the internal debounce timestamp, so no state leaks in from
    // a previous test.
    setSessionExpiredHandler(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    setSessionExpiredHandler(null);
  });

  it("marks a 401 that survives a refresh attempt as isSessionExpired", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    queueExpiredSessionAttempt(fetchMock);

    let caught: unknown;
    try {
      await apiRequest("/users");
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(401);
    expect((caught as ApiError).isSessionExpired).toBe(true);
  });

  it("does not mark an ordinary error as isSessionExpired", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(500, { message: "Something broke" }),
    );

    let caught: unknown;
    try {
      await apiRequest("/users");
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).isSessionExpired).toBe(false);
  });

  it("retries and succeeds when the refresh attempt itself succeeds", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: "Unauthorized" }));
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {})); // refresh succeeds
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { message: "ok", users: [] }));

    const result = await apiRequest("/users");
    expect(result).toEqual({ message: "ok", users: [] });
  });

  it("notifies the session-expired handler once for a single expired request", async () => {
    const handler = vi.fn();
    setSessionExpiredHandler(handler);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    queueExpiredSessionAttempt(fetchMock);

    await expect(apiRequest("/users")).rejects.toBeInstanceOf(ApiError);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("coalesces a burst of near-simultaneous expired-session failures into a single notification", async () => {
    const handler = vi.fn();
    setSessionExpiredHandler(handler);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    queueExpiredSessionAttempt(fetchMock);
    queueExpiredSessionAttempt(fetchMock);

    await expect(apiRequest("/a")).rejects.toBeInstanceOf(ApiError);
    await expect(apiRequest("/b")).rejects.toBeInstanceOf(ApiError);

    // Both requests failed (both callers still get their own ApiError to
    // show, e.g. in an ErrorState), but the disruptive global toast only
    // fires once for what is really one underlying event.
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("notifies again once the debounce window has passed", async () => {
    const handler = vi.fn();
    setSessionExpiredHandler(handler);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    queueExpiredSessionAttempt(fetchMock);
    queueExpiredSessionAttempt(fetchMock);

    await expect(apiRequest("/a")).rejects.toBeInstanceOf(ApiError);
    vi.advanceTimersByTime(2100);
    await expect(apiRequest("/b")).rejects.toBeInstanceOf(ApiError);

    expect(handler).toHaveBeenCalledTimes(2);
  });
});
