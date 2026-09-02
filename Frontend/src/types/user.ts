import type { Contact } from "./contact";
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
  contacts?: Contact[];
  createdAt: string;
  updatedAt: string;
}

/** Minimal, non-sensitive snapshot kept in sessionStorage to survive page reloads. */
export type SafeUser = Omit<User, "contacts">;

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  departmentId?: string | null;
  role?: UserRole;
}
