type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
  showLoader?: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getAuthToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(/(?:^|; )tatvivah_access=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getErrorMessage(data: any, fallback: string) {
  return data?.error?.message ?? data?.message ?? fallback;
}

/** Messages that indicate the auth session is truly invalid and cookies should be cleared. */
const TOKEN_INVALID_MESSAGES = [
  "access token required",
  "access token has expired",
  "invalid access token",
  "authentication required",
];

function isTokenError(data: any): boolean {
  const msg = (data?.error?.message ?? data?.message ?? "").toLowerCase();
  return TOKEN_INVALID_MESSAGES.some((m) => msg.includes(m));
}

function clearAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = "tatvivah_access=; path=/; max-age=0";
  document.cookie = "tatvivah_role=; path=/; max-age=0";
  document.cookie = "tatvivah_user=; path=/; max-age=0";
  window.dispatchEvent(new Event("tatvivah-auth"));
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const { body, token, headers, showLoader = true, ...rest } = options;
  const authToken = token ?? getAuthToken();

  const finalHeaders: HeadersInit = {
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(headers ?? {}),
  };

  if (showLoader && typeof window !== "undefined") {
    window.dispatchEvent(new Event("tv-global-loading-start"));
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Only clear auth cookies when the backend explicitly says the token is invalid/expired.
      // Do NOT clear on generic 401/403 (e.g. "User not found", "Insufficient permissions").
      if ((response.status === 401 || response.status === 403) && isTokenError(data)) {
        clearAuthCookies();
      }
      throw new Error(getErrorMessage(data, "Request failed"));
    }

    return data as T;
  } finally {
    if (showLoader && typeof window !== "undefined") {
      window.dispatchEvent(new Event("tv-global-loading-end"));
    }
  }
}
