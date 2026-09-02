import { ApiError } from "../types/api";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:3001/api";

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | undefined>;
}

/** Notified when a request comes back 401 even after a refresh attempt. */
let sessionExpiredHandler: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

function buildUrl(path: string, query?: Record<string, string | undefined>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

async function rawFetch(path: string, options: RequestOptions): Promise<Response> {
  return fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    credentials: "include",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : {},
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

interface ErrorBody {
  message?: string;
  errors?: string[];
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function toApiError(status: number, body: unknown): ApiError {
  const errorBody = (body ?? {}) as ErrorBody;
  const message = errorBody.message ?? "Something went wrong. Please try again.";
  return new ApiError(status, message, errorBody.errors);
}

// Coalesces concurrent refresh attempts into a single call instead of a
// stampede. This matters beyond the 401-retry path: refresh tokens rotate on
// every use, so two independent refresh calls racing on the same cookie
// (e.g. React StrictMode's double effect-invocation on mount, or two tabs)
// would otherwise cause the loser to be rejected and the session dropped.
let refreshInFlight: Promise<boolean> | null = null;
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = rawFetch("/auth/refresh", { method: "POST" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

const NO_REFRESH_RETRY_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
]);

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const res = await rawFetch(path, options);

  if (res.status === 401 && !isRetry && !NO_REFRESH_RETRY_PATHS.has(path)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequest<T>(path, options, true);
    }
    sessionExpiredHandler?.();
    const body = await parseJson(res);
    throw toApiError(res.status, body);
  }

  const body = await parseJson(res);

  if (!res.ok) {
    throw toApiError(res.status, body);
  }

  return body as T;
}
