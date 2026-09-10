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

function buildUrl(
  path: string,
  query?: Record<string, string | undefined>,
): string {
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

async function rawFetch(
  path: string,
  options: RequestOptions,
): Promise<Response> {
  return fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    credentials: "include",
    headers:
      options.body !== undefined ? { "Content-Type": "application/json" } : {},
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

interface ErrorBody {
  message?: string;
  errors?: string[];
}

interface ParsedBody {
  json: unknown;
  /** The raw response text, kept around for when the body isn't JSON (e.g. the
   * plain-text 429 body express-rate-limit sends) so that message isn't lost. */
  rawText: string;
}

async function parseBody(res: Response): Promise<ParsedBody> {
  const text = await res.text();
  if (!text) return { json: undefined, rawText: "" };
  try {
    return { json: JSON.parse(text), rawText: text };
  } catch {
    return { json: undefined, rawText: text };
  }
}

function toApiError(status: number, body: ParsedBody): ApiError {
  const errorBody = (body.json ?? {}) as ErrorBody;
  const rawText = body.rawText.trim();
  // A short, non-HTML plain-text body (like express-rate-limit's default 429
  // message) is almost certainly a human-readable error - show it rather than
  // a generic fallback. Anything longer or HTML-shaped is more likely an
  // infra error page, which isn't safe or useful to surface as-is.
  const isPlainTextMessage = rawText.length > 0 && rawText.length <= 300 && !rawText.startsWith("<");
  // requestValidator's `message` is just a fixed "Validation failed" label -
  // the actual per-field reasons live in `errors`, so prefer showing those
  // (e.g. "Invalid ticket ID format") over the generic label when present.
  const message =
    (errorBody.errors?.length ? errorBody.errors.join(", ") : undefined) ??
    errorBody.message ??
    (isPlainTextMessage ? rawText : "Something went wrong. Please try again.");
  return new ApiError(status, message, errorBody.errors);
}

// Coalesces concurrent refresh attempts into a single call instead of a
// stampede. This matters beyond the 401-retry path: refresh tokens rotate on
// every use, so two independent refresh calls racing on the same cookie
// (e.g. React StrictMode's double effect-invocation on mount, or two tabs)
// would otherwise cause the loser to be rejected and the session dropped.
let refreshInFlight: Promise<boolean> | null = null; //create a vraibale to stop the second call if first it running
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = rawFetch("/auth/refresh", { method: "POST" }) //promise is always true value so the refreshInFlight return
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null; //finally execute the clean up  after the refreshSession return the promise.
      });
  }
  return refreshInFlight; //it is also a fallback in case already running
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
    const body = await parseBody(res);
    throw toApiError(res.status, body);
  }

  const body = await parseBody(res);

  if (!res.ok) {
    throw toApiError(res.status, body);
  }

  return body.json as T;
}
