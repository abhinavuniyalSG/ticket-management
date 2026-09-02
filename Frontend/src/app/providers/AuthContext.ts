import { createContext } from "react";
import type { LoginPayload, RegisterPayload } from "../../services/authService";
import type { SafeUser } from "../../types/user";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: SafeUser | null;
  status: AuthStatus;
  login: (payload: LoginPayload) => Promise<SafeUser>;
  register: (payload: RegisterPayload) => Promise<SafeUser>;
  logout: () => Promise<void>;
  setUser: (user: SafeUser | null) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
