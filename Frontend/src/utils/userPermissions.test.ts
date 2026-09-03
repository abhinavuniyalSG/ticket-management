import { describe, it, expect } from "vitest";
import {
  canDeleteUser,
  canEditUserDepartment,
  canEditUserName,
  canEditUserRole,
} from "./userPermissions";
import type { User } from "../types/user";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    firstName: "Test",
    lastName: "User",
    role: "user",
    email: "test.user@example.com",
    isVerified: true,
    departmentId: "dept-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("canDeleteUser", () => {
  it("lets a super admin delete anyone", () => {
    const actor = makeUser({ role: "super_admin" });
    const target = makeUser({ id: "other" });
    expect(canDeleteUser(actor, target)).toBe(true);
  });

  it("lets an admin delete their own account", () => {
    const actor = makeUser({ id: "admin-1", role: "admin" });
    expect(canDeleteUser(actor, actor)).toBe(true);
  });

  it("lets an admin delete someone in the same department", () => {
    const actor = makeUser({ role: "admin", departmentId: "dept-1" });
    const target = makeUser({ id: "other", departmentId: "dept-1" });
    expect(canDeleteUser(actor, target)).toBe(true);
  });

  it("blocks an admin from deleting someone in a different department", () => {
    const actor = makeUser({ role: "admin", departmentId: "dept-1" });
    const target = makeUser({ id: "other", departmentId: "dept-2" });
    expect(canDeleteUser(actor, target)).toBe(false);
  });

  it("blocks an admin with no department from deleting anyone else", () => {
    const actor = makeUser({ role: "admin", departmentId: null });
    const target = makeUser({ id: "other", departmentId: null });
    expect(canDeleteUser(actor, target)).toBe(false);
  });

  it("lets a regular user delete only their own account", () => {
    const actor = makeUser({ id: "user-1", role: "user" });
    expect(canDeleteUser(actor, actor)).toBe(true);
    expect(canDeleteUser(actor, makeUser({ id: "other" }))).toBe(false);
  });
});

describe("canEditUserRole", () => {
  it("only a super admin can change roles", () => {
    expect(canEditUserRole(makeUser({ role: "super_admin" }))).toBe(true);
    expect(canEditUserRole(makeUser({ role: "admin" }))).toBe(false);
    expect(canEditUserRole(makeUser({ role: "user" }))).toBe(false);
  });
});

describe("canEditUserDepartment", () => {
  it("lets a super admin move anyone, including themselves", () => {
    const actor = makeUser({ role: "super_admin" });
    expect(canEditUserDepartment(actor, actor)).toBe(true);
  });

  it("lets an admin move someone else", () => {
    const actor = makeUser({ id: "admin-1", role: "admin" });
    const target = makeUser({ id: "other" });
    expect(canEditUserDepartment(actor, target)).toBe(true);
  });

  it("blocks an admin from moving their own department", () => {
    const actor = makeUser({ id: "admin-1", role: "admin" });
    expect(canEditUserDepartment(actor, actor)).toBe(false);
  });

  it("blocks a regular user entirely", () => {
    const actor = makeUser({ role: "user" });
    expect(canEditUserDepartment(actor, makeUser({ id: "other" }))).toBe(false);
  });
});

describe("canEditUserName", () => {
  it("lets anyone edit their own name", () => {
    const actor = makeUser({ id: "user-1", role: "user" });
    expect(canEditUserName(actor, actor)).toBe(true);
  });

  it("lets a super admin edit anyone's name", () => {
    const actor = makeUser({ role: "super_admin" });
    const target = makeUser({ id: "other", departmentId: "dept-2" });
    expect(canEditUserName(actor, target)).toBe(true);
  });

  it("lets an admin edit a name within their own department", () => {
    const actor = makeUser({ role: "admin", departmentId: "dept-1" });
    const target = makeUser({ id: "other", departmentId: "dept-1" });
    expect(canEditUserName(actor, target)).toBe(true);
  });

  it("blocks an admin from editing a name in another department", () => {
    const actor = makeUser({ role: "admin", departmentId: "dept-1" });
    const target = makeUser({ id: "other", departmentId: "dept-2" });
    expect(canEditUserName(actor, target)).toBe(false);
  });

  it("blocks a regular user from editing someone else's name", () => {
    const actor = makeUser({ id: "user-1", role: "user" });
    const target = makeUser({ id: "other" });
    expect(canEditUserName(actor, target)).toBe(false);
  });
});
