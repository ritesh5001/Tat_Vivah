import { COOKIE_ATTRIBUTES_SUFFIX } from "@/lib/site-config";
import { reportApiActivity } from "@/lib/navigation-feedback";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
  /** Internal flag to prevent infinite refresh loops */
  _isRetry?: boolean;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5000" : "");

const DEV_FALLBACK_API_BASE_URL = "http://localhost:5000";
const API_REQUEST_TIMEOUT_MS = 15000;

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

function getErrorMessage(data: any, fallback: string) {
  return data?.error?.message ?? data?.message ?? fallback;
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
  document.cookie = `tatvivah_access=; path=/; max-age=0${COOKIE_ATTRIBUTES_SUFFIX}`;
  document.cookie = `tatvivah_refresh=; path=/; max-age=0${COOKIE_ATTRIBUTES_SUFFIX}`;
  document.cookie = `tatvivah_role=; path=/; max-age=0${COOKIE_ATTRIBUTES_SUFFIX}`;
  document.cookie = `tatvivah_user=; path=/; max-age=0${COOKIE_ATTRIBUTES_SUFFIX}`;
  window.dispatchEvent(new Event("tatvivah-auth"));
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * On success, updates both cookies and returns the new access token.
 * On failure, returns null.
 */
let _refreshPromise: Promise<string | null> | null = null;

async function silentRefresh(): Promise<string | null> {
  // De-duplicate concurrent refresh attempts
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken || !API_BASE_URL) return null;

      const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return null;

      const data = await response.json().catch(() => null);
      if (!data?.accessToken) return null;

      // Persist new tokens
      document.cookie = `tatvivah_access=${data.accessToken}; path=/; max-age=86400${COOKIE_ATTRIBUTES_SUFFIX}`;
      if (data.refreshToken) {
        document.cookie = `tatvivah_refresh=${data.refreshToken}; path=/; max-age=604800${COOKIE_ATTRIBUTES_SUFFIX}`;
      }

      return data.accessToken as string;
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

  const { body, token, headers, _isRetry, ...rest } = options;
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
          signal: withTimeout(rest.signal ?? null, API_REQUEST_TIMEOUT_MS),
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
      }
    }

    if (lastError?.name === "AbortError") {
      throw new Error("Request timed out. Please check backend/API URL and try again.");
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
