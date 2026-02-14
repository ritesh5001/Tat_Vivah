import * as React from "react";
import { loadSession, saveSession, clearSession, type AuthSession } from "../storage/auth";
import { loginUser, type LoginPayload } from "../services/auth";
import { setSessionExpiredHandler } from "../services/api";

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Hydrate session from secure storage
  React.useEffect(() => {
    const hydrate = async () => {
      const stored = await loadSession();
      setSession(stored);
      setIsLoading(false);
    };
    hydrate();
  }, []);

  // Register callback so the API layer can force sign-out on refresh failure
  React.useEffect(() => {
    setSessionExpiredHandler(() => {
      setSession(null);
    });
    return () => setSessionExpiredHandler(() => {});
  }, []);

  const signIn = React.useCallback(async (payload: LoginPayload) => {
    const result = await loginUser(payload);
    const nextSession: AuthSession = {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
    await saveSession(nextSession);
    setSession(nextSession);
  }, []);

  const signOut = React.useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  const value = React.useMemo(
    () => ({ session, isLoading, signIn, signOut }),
    [session, isLoading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
