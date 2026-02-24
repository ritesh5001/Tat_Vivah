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

  const { body, token, headers, showLoader, ...rest } = options;
  const authToken = token ?? getAuthToken();
  const method = rest.method ?? "GET";
  const shouldShowLoader = typeof showLoader === "boolean" ? showLoader : method !== "GET";

  const finalHeaders: HeadersInit = {
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(headers ?? {}),
  };

  if (shouldShowLoader && typeof window !== "undefined") {
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
      if (response.status === 401 || response.status === 403) {
        clearAuthCookies();
      }
      throw new Error(getErrorMessage(data, "Request failed"));
    }

    return data as T;
  } finally {
    if (shouldShowLoader && typeof window !== "undefined") {
      window.dispatchEvent(new Event("tv-global-loading-end"));
    }
  }
}
