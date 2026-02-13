import { getAccessToken } from "../storage/auth";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

const fallbackBaseUrl = "http://localhost:3000";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackBaseUrl;

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, token, headers, ...rest } = options;
  const authToken = token ?? (await getAccessToken());

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message ?? data?.message ?? "Request failed";
    throw new Error(message);
  }

  return data as T;
}
