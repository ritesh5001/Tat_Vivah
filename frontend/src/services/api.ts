import { setSessionCookie, clearSessionCookie } from "@/lib/cookie";
import { reportApiActivity } from "@/lib/navigation-feedback";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
  /**
   * Override the default request timeout. Use a long timeout for operations
   * that legitimately take many seconds (order placement, payment initiation),
   * where aborting early leaves the server-side work half-observed.
   */
  timeoutMs?: number;
  /** Internal flag to prevent infinite refresh loops */
  _isRetry?: boolean;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5000" : "");

const DEV_FALLBACK_API_BASE_URL = "http://localhost:5000";

/**
 * Default request timeout. Measured latencies against the live stack: ~2.5s for a
 * cart read, ~7s to add a cart item — the API and its Postgres are in different
 * regions, so every query pays a real round-trip. The previous 15s left under 2x
 * headroom on an already-warm request, which surfaced as buttons that "did
 * nothing" because the client gave up on work the server went on to complete.
 */
const API_REQUEST_TIMEOUT_MS = 30000;

/**
 * Timeout for order/payment mutations. Placing an order does cart validation,
 * an inventory-reserving transaction, GST calculation, then a PhonePe OAuth +
 * order-create round-trip. On a cold/slow backend that comfortably exceeds the
 * default 15s — and aborting mid-flight strands an order the client never
 * learns about. Give these calls real headroom.
 */
export const CHECKOUT_REQUEST_TIMEOUT_MS = 90000;

/**
 * Thrown when a request is aborted by our own timeout. Distinct from a generic
 * failure because the server may have completed the work — never treat this as
 * "nothing happened" for a mutation.
 */
export class ApiTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiTimeoutError";
  }
}

export const swrConfig = {
  dedupingInterval: 5000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  errorRetryCount: 2,
} as const;

function getAuthToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(/(?:^|; )tatvivah_access=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getRefreshToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(/(?:^|; )tatvivah_refresh=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getErrorMessage(data: unknown, fallback: string) {
  const payload =
    data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  const error =
    payload?.error && typeof payload.error === "object"
      ? (payload.error as Record<string, unknown>)
      : null;
  const apiMessage =
    (typeof error?.message === "string" ? error.message : undefined) ??
    (typeof payload?.message === "string" ? payload.message : undefined);
  const details =
    error?.details && typeof error.details === "object"
      ? (error.details as Record<string, unknown>)
      : null;

  if (details) {
    const firstDetail = Object.values(details).find(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );

    if (firstDetail) {
      return firstDetail;
    }
  }

  return apiMessage ?? fallback;
}

function normalizeMethod(method?: string) {
  return method?.toUpperCase() ?? "GET";
}

function isMutationMethod(method: string) {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

function getActivityLabel(method: string) {
  if (method === "DELETE") return "Removing item";
  if (method === "PATCH" || method === "PUT") return "Applying your changes";
  if (method === "POST") return "Submitting your request";
  return "Processing your request";
}

function clearAuthCookies() {
  if (typeof document === "undefined") return;
  clearSessionCookie("tatvivah_access");
  clearSessionCookie("tatvivah_refresh");
  clearSessionCookie("tatvivah_role");
  clearSessionCookie("tatvivah_user");
  window.dispatchEvent(new Event("tatvivah-auth"));
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * On success, updates both cookies and returns the new access token.
 * On failure, returns null.
 */
let _refreshPromise: Promise<string | null> | null = null;

async function requestNewTokens(refreshToken: string): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) return null;

  const data = await response.json().catch(() => null);
  if (!data?.accessToken) return null;

  // Persist new tokens (host-only fallback if domain-scoped write is rejected)
  setSessionCookie("tatvivah_access", data.accessToken, 86400);
  if (data.refreshToken) {
    setSessionCookie("tatvivah_refresh", data.refreshToken, 604800);
  }

  return data.accessToken as string;
}

async function silentRefresh(): Promise<string | null> {
  // De-duplicate concurrent refresh attempts within this tab
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken || !API_BASE_URL) return null;

      const accessToken = await requestNewTokens(refreshToken);
      if (accessToken) return accessToken;

      // Refresh tokens rotate on every use, so a concurrent refresh from
      // another tab invalidates the token we just sent. If the cookie has
      // changed since we read it, the other tab won the race — retry once
      // with the rotated token instead of dropping the session.
      await new Promise((resolve) => setTimeout(resolve, 750));
      const latestRefreshToken = getRefreshToken();
      if (latestRefreshToken && latestRefreshToken !== refreshToken) {
        return await requestNewTokens(latestRefreshToken);
      }

      return null;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || (error as { name?: string })?.name === "AbortError";
}

function withTimeout(signal: AbortSignal | null | undefined, timeoutMs: number): AbortSignal {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener(
        "abort",
        () => {
          controller.abort();
        },
        { once: true }
      );
    }
  }

  controller.signal.addEventListener(
    "abort",
    () => {
      clearTimeout(timeout);
    },
    { once: true }
  );

  return controller.signal;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const { body, token, headers, timeoutMs, _isRetry, ...rest } = options;
  const method = normalizeMethod(rest.method);
  const shouldTrackActivity =
    typeof window !== "undefined" && isMutationMethod(method) && !_isRetry;
  const authToken = token ?? getAuthToken();

  const finalHeaders: HeadersInit = {
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(headers ?? {}),
  };

  if (shouldTrackActivity) {
    reportApiActivity({
      type: "start",
      method,
      path,
      label: getActivityLabel(method),
    });
  }

  try {
    const baseUrls = [API_BASE_URL];
    if (
      process.env.NODE_ENV === "development" &&
      API_BASE_URL !== DEV_FALLBACK_API_BASE_URL
    ) {
      baseUrls.push(DEV_FALLBACK_API_BASE_URL);
    }

    let lastError: Error | null = null;

    for (const baseUrl of baseUrls) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          ...rest,
          headers: finalHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: withTimeout(
            rest.signal ?? null,
            timeoutMs ?? API_REQUEST_TIMEOUT_MS
          ),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          // On 401, attempt a silent token refresh before giving up
          if (response.status === 401 && !_isRetry && !token) {
            const newToken = await silentRefresh();
            if (newToken) {
              // Retry the original request with the fresh token
              return apiRequest<T>(path, { ...options, token: newToken, _isRetry: true });
            }
            // Refresh failed — clear session
            clearAuthCookies();
          } else if (response.status === 401 || response.status === 403) {
            clearAuthCookies();
          }
          throw new Error(getErrorMessage(data, "Request failed"));
        }

        return data as T;
      } catch (error) {
        if (!isNetworkError(error)) {
          throw error;
        }

        lastError =
          error instanceof Error
            ? error
            : new Error("Network request failed");

        // A timed-out mutation may already have been applied server-side. Re-sending
        // it to the next base URL could place a second order / take a second payment,
        // so stop here and let the caller reconcile.
        if (lastError.name === "AbortError" && isMutationMethod(method)) {
          break;
        }
      }
    }

    if (lastError?.name === "AbortError") {
      // Distinguishable type: a timed-out mutation may well have SUCCEEDED on the
      // server. Callers that create orders must reconcile rather than re-submit.
      throw new ApiTimeoutError(
        "The server took too long to respond. Your request may still have gone through."
      );
    }

    throw new Error("Unable to reach API. Please check backend server and API base URL.");
  } finally {
    if (shouldTrackActivity) {
      reportApiActivity({
        type: "end",
        method,
        path,
      });
    }
  }
}
