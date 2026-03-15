import axios, {
  AxiosError,
  isAxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL, ApiError, triggerSessionExpired } from "./api";
import { clearSession, getAccessToken, loadSession, updateTokens } from "../storage/auth";

const REFRESH_THRESHOLD_SECONDS = 60;

function isTokenExpiringSoon(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    if (typeof exp !== "number") return false;
    return exp < Date.now() / 1000 + REFRESH_THRESHOLD_SECONDS;
  } catch {
    return false;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<string | null> => {
    try {
      const session = await loadSession();
      if (!session?.refreshToken) return null;

      const response = await axios.post(
        `${API_BASE_URL}/v1/auth/refresh`,
        { refreshToken: session.refreshToken },
        { headers: { "Content-Type": "application/json", Accept: "application/json" } }
      );

      const body = response.data as { accessToken?: string; refreshToken?: string } | null;
      if (!body?.accessToken || !body?.refreshToken) return null;

      await updateTokens(body.accessToken, body.refreshToken);
      return body.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function extractApiMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const maybe = data as { error?: { message?: string }; message?: string };
  return maybe.error?.message ?? maybe.message ?? null;
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    const msg =
      extractApiMessage(err.response?.data) ??
      err.message ??
      "Request failed";
    return new ApiError(status, msg);
  }
  return new ApiError(0, err instanceof Error ? err.message : "Request failed");
}

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Accept: "application/json",
    },
  });

  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const nextConfig = config as InternalAxiosRequestConfig & { _retry?: boolean };
    const token = await getAccessToken();

    if (token && !nextConfig._retry && isTokenExpiringSoon(token)) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        nextConfig.headers = nextConfig.headers ?? {};
        nextConfig.headers.Authorization = `Bearer ${refreshed}`;
        return nextConfig;
      }
    }

    if (token) {
      nextConfig.headers = nextConfig.headers ?? {};
      nextConfig.headers.Authorization = `Bearer ${token}`;
    }

    return nextConfig;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalConfig = (error.config ?? {}) as AxiosRequestConfig & { _retry?: boolean };

      if (status === 401 && !originalConfig._retry) {
        const newToken = await attemptTokenRefresh();
        if (newToken) {
          originalConfig._retry = true;
          originalConfig.headers = originalConfig.headers ?? {};
          (originalConfig.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
          return client.request(originalConfig);
        }

        const session = await loadSession();
        if (session?.accessToken) {
          await clearSession();
          triggerSessionExpired();
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createClient();

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);
    return response.data as T;
  } catch (err) {
    throw toApiError(err);
  }
}
