import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { refreshSession, revokeSession, verifySession, type AuthTokens, type CustomerIdentity, type OwnerIdentity } from "@/services/api";
import { readStoredSession, writeStoredSession } from "@/services/auth/storage";
export type AuthRole = "customer" | "owner" | "admin" | "referral";
export type AuthSession = {
  role: AuthRole;
  tokens: AuthTokens;
  identity: OwnerIdentity | CustomerIdentity | { id: number; email: string };
  preview?: boolean;
};
type AuthValue = {
  ready: boolean;
  session: AuthSession | null;
  signIn: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
  rotateSession: () => Promise<AuthSession | null>;
};
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const persist = useCallback(async (next: AuthSession | null) => {
    setSession(next);
    await writeStoredSession(next ? JSON.stringify(next) : null);
  }, []);
  const rotate = useCallback(async (current: AuthSession) => {
    if (!current.tokens.refreshToken) throw new Error("Session cannot be refreshed");
    const rotated = await refreshSession(current.tokens.refreshToken);
    const next = {
      ...current,
      tokens: { accessToken: rotated.accessToken, refreshToken: rotated.refreshToken },
    };
    await verifySession(next.tokens.accessToken);
    await persist(next);
    return next;
  }, [persist]);
  useEffect(() => {
    void readStoredSession().then(async (raw) => {
      if (!raw) return;
      try {
        let stored = JSON.parse(raw) as AuthSession;
        if (stored.preview) {
          if (!__DEV__) throw new Error("Preview sessions are disabled in production");
        } else {
          try {
            const verified = await verifySession(stored.tokens.accessToken);
            stored = { ...stored, role: verified.role, identity: verified.identity };
          } catch {
            stored = await rotate(stored);
          }
        }
        await persist(stored);
      } catch {
        await persist(null);
      }
    }).finally(() => setReady(true));
  }, [persist, rotate]);
  useEffect(() => {
    if (!session || session.preview || !session.tokens.refreshToken) return;
    const timer = setInterval(() => {
      void rotate(session).catch(() => persist(null));
    }, 12 * 60 * 1000);
    return () => clearInterval(timer);
  }, [session, rotate, persist]);
  const signIn = useCallback(async (next: AuthSession) => {
    if (next.preview && !__DEV__) throw new Error("Preview sessions are disabled in production");
    await persist(next);
  }, [persist]);
  const signOut = useCallback(async () => {
    const token = session?.tokens.refreshToken;
    await persist(null);
    if (token) void revokeSession(token).catch(() => undefined);
  }, [session, persist]);
  const rotateSession = useCallback(async (): Promise<AuthSession | null> => {
    if (!session?.tokens?.refreshToken) {
      await persist(null);
      return null;
    }
    try {
      const next = await rotate(session);
      return next;
    } catch {
      await persist(null);
      return null;
    }
  }, [session, rotate, persist]);
  const value = useMemo(
    () => ({ ready, session, signIn, signOut, rotateSession }),
    [ready, session, signIn, signOut, rotateSession]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error("useAuth must be used inside AuthProvider");return value}
