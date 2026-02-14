import {
  getAccessToken,
  loadSession,
  updateTokens,
  clearSession,
} from "../storage/auth";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!RAW_BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_BASE_URL is not defined. Check your .env file."
  );
}

/** Base URL with any trailing slashes stripped. */
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

// ---------------------------------------------------------------------------
// Session-expired callback (registered by AuthProvider on mount)
// ---------------------------------------------------------------------------
let sessionExpiredHandler: (() => void) | null = null;

/** Called by AuthProvider to receive forced-logout events. */
export function setSessionExpiredHandler(handler: () => void) {
  sessionExpiredHandler = handler;
}

// ---------------------------------------------------------------------------
// Centralized API error
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.statusCode === 401;
  }

  get isNetworkError() {
    return this.statusCode === 0;
  }
}

// ---------------------------------------------------------------------------
// Refresh-token mutex — ensures only one concurrent refresh request
// ---------------------------------------------------------------------------
let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<string | null> => {
    try {
      const session = await loadSession();
      if (!session?.refreshToken) return null;

      // Direct fetch avoids re-entering apiRequest (would loop on 401)
      const res = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      if (!res.ok) return null;

      const body = await res.json().catch(() => null);
      if (!body?.accessToken || !body?.refreshToken) return null;

      await updateTokens(body.accessToken, body.refreshToken);
      return body.accessToken as string;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------
type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
  /** @internal single-retry guard */
  _retry?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, token, _retry, headers, ...rest } = options;
  const authToken = token ?? (await getAccessToken());

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...((headers as Record<string, string>) ?? {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...rest,
    });
  } catch (err) {
    // Network-level failure (no internet, DNS, timeout …)
    throw new ApiError(
      0,
      err instanceof Error ? err.message : "Network request failed"
    );
  }

  // ---- 401 interception: single retry via refresh token ----
  if (response.status === 401 && !_retry) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      return apiRequest<T>(path, { ...options, token: newToken, _retry: true });
    }
    // Refresh also failed → force sign-out
    await clearSession();
    sessionExpiredHandler?.();
    throw new ApiError(401, "Session expired. Please sign in again.");
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const msg =
      (data as any)?.error?.message ??
      (data as any)?.message ??
      "Request failed";
    const details = (data as any)?.error?.details;
    throw new ApiError(response.status, msg, details);
  }

  return data as T;
}
