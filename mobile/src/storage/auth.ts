import * as SecureStore from "expo-secure-store";

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

const AUTH_STORAGE_KEY = "tatvivah.auth";
let cachedSession: AuthSession | null | undefined;

export async function loadSession(): Promise<AuthSession | null> {
  if (cachedSession !== undefined) {
    return cachedSession;
  }

  const stored = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
  if (!stored) {
    cachedSession = null;
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as AuthSession;
    cachedSession = parsed;
    return parsed;
  } catch {
    cachedSession = null;
    return null;
  }
}

export async function saveSession(session: AuthSession): Promise<void> {
  cachedSession = session;
  await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  cachedSession = null;
  await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  const session = await loadSession();
  return session?.accessToken ?? null;
}
