type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
  /** Internal flag to prevent infinite refresh loops */
  _isRetry?: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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

const isProd = process.env.NODE_ENV === "production";
const cookieDomain = isProd ? "; domain=.tatvivahtrends.com" : "";

function clearAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = `tatvivah_access=; path=/; max-age=0${cookieDomain}`;
  document.cookie = `tatvivah_refresh=; path=/; max-age=0${cookieDomain}`;
  document.cookie = `tatvivah_role=; path=/; max-age=0${cookieDomain}`;
  document.cookie = `tatvivah_user=; path=/; max-age=0${cookieDomain}`;
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
      document.cookie = `tatvivah_access=${data.accessToken}; path=/; max-age=86400${cookieDomain}`;
      if (data.refreshToken) {
        document.cookie = `tatvivah_refresh=${data.refreshToken}; path=/; max-age=604800${cookieDomain}`;
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

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const { body, token, headers, _isRetry, ...rest } = options;
  const authToken = token ?? getAuthToken();

  const finalHeaders: HeadersInit = {
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(headers ?? {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
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
}
