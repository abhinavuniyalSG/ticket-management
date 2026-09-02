import { apiRequest } from "./apiClient";
import type { User } from "../types/user";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  email: string;
  oldPassword: string;
  newPassword: string;
}

interface MessageResponse {
  message: string;
}

interface AuthResponse {
  message: string;
  user: User;
}

export const authService = {
  register: (payload: RegisterPayload) =>
    apiRequest<AuthResponse>("/auth/register", { method: "POST", body: payload }),

  login: (payload: LoginPayload) =>
    apiRequest<AuthResponse>("/auth/login", { method: "POST", body: payload }),

  refresh: () => apiRequest<MessageResponse>("/auth/refresh", { method: "POST" }),

  logout: () => apiRequest<MessageResponse>("/auth/logout", { method: "POST" }),

  changePassword: (payload: ChangePasswordPayload) =>
    apiRequest<MessageResponse>("/auth/change-password", { method: "POST", body: payload }),

  verifyEmail: (token: string) =>
    apiRequest<MessageResponse>(`/auth/verify-email/${encodeURIComponent(token)}`),

  resendVerification: (email: string) =>
    apiRequest<MessageResponse>("/auth/resend-verification", {
      method: "POST",
      body: { email },
    }),
};
