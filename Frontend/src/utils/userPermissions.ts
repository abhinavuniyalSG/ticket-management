import type { User } from "../types/user";

export function canDeleteUser(actor: User, target: User): boolean {
  if (actor.role === "super_admin") return true;
  if (actor.role === "admin") {
    if (actor.id === target.id) return true;
    return Boolean(actor.departmentId) && actor.departmentId === target.departmentId;
  }
  return actor.id === target.id;
}

/** Only super_admin may change a user's role. */
export function canEditUserRole(actor: User): boolean {
  return actor.role === "super_admin";
}

/**
 * super_admin can move anyone (including themselves); an admin may move
 * someone else in their own department, but never their own department.
 */
export function canEditUserDepartment(actor: User, target: User): boolean {
  if (actor.role === "super_admin") return true;
  if (actor.role === "admin") return actor.id !== target.id;
  return false;
}

export function canEditUserName(actor: User, target: User): boolean {
  if (actor.id === target.id) return true;
  if (actor.role === "super_admin") return true;
  if (actor.role === "admin") return actor.departmentId === target.departmentId;
  return false;
}
