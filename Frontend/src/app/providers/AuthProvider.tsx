import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import toast from "react-hot-toast";
import { authService } from "../../services/authService";
import type { LoginPayload, RegisterPayload } from "../../services/authService";
import { refreshSession, setSessionExpiredHandler } from "../../services/apiClient";
import type { SafeUser } from "../../types/user";
import { ApiError } from "../../types/api";
import { AuthContext } from "./AuthContext";
import type { AuthContextValue, AuthStatus } from "./AuthContext";

const SESSION_STORAGE_KEY = "tms.session.user";

function readCachedUser(): SafeUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SafeUser) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(user: SafeUser | null): void {
  try {
    if (user) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // sessionStorage may be unavailable (e.g. private browsing) — safe to ignore.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<SafeUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const setUser = useCallback((next: SafeUser | null) => {
    setUserState(next);
    writeCachedUser(next);
    setStatus(next ? "authenticated" : "unauthenticated");
  }, []);

  // Restore the session on startup. The backend has no /auth/me or
  // /users/me endpoint, so the only way to confirm a session is still valid
  // is POST /auth/refresh; the actual profile (name/role/etc) can only come
  // from a cached copy written after the last successful login/register.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const cached = readCachedUser();
      const refreshed = await refreshSession();
      if (cancelled) return;
      if (refreshed && cached) {
        setUserState(cached);
        setStatus("authenticated");
      } else {
        writeCachedUser(null);
        setStatus("unauthenticated");
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUserState(null);
      writeCachedUser(null);
      setStatus("unauthenticated");
      toast.error("Your session has expired. Please sign in again.");
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await authService.login(payload);
      setUser(result.user);
      return result.user;
    },
    [setUser],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const result = await authService.register(payload);
      setUser(result.user);
      return result.user;
    },
    [setUser],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
    } finally {
      setUser(null);
    }
  }, [setUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, setUser }),
    [user, status, login, register, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
