import type { Department } from "./department";

export type UserRole = "user" | "admin" | "super_admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  email: string;
  isVerified: boolean;
  departmentId: string | null;
  department?: Department | null;
  createdAt: string;
  updatedAt: string;
}

/** Minimal, non-sensitive snapshot kept in sessionStorage to survive page reloads. */
export type SafeUser = User;

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  departmentId?: string | null;
  role?: UserRole;
}
