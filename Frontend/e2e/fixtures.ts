import type { Page } from "@playwright/test";

/**
 * Every page mounts <AuthProvider>, which immediately calls POST
 * /auth/refresh to check whether a session cookie is still valid. Mocking
 * that call lets each test control whether the app starts out "logged in"
 * or "logged out" without needing a real backend or database.
 */
export async function mockLoggedOut(page: Page): Promise<void> {
  await page.route("**/auth/refresh", (route) =>
    route.fulfill({ status: 401, json: { message: "No active session" } }),
  );
}

/**
 * AuthProvider restores a session by reading a cached user from
 * sessionStorage *before* it calls POST /auth/refresh - there is no
 * /auth/me endpoint, so the cached copy is the only source of profile data
 * after a page load. addInitScript() runs before any page script on every
 * subsequent navigation, which is what lets us seed that cache ahead of the
 * app's own bootstrap code.
 */
export async function mockLoggedIn(
  page: Page,
  user: ReturnType<typeof fakeUser> = fakeUser(),
): Promise<void> {
  await page.addInitScript((storedUser) => {
    window.sessionStorage.setItem("tms.session.user", JSON.stringify(storedUser));
  }, user);
  await page.route("**/auth/refresh", (route) =>
    route.fulfill({ status: 200, json: { message: "Refreshed" } }),
  );
}

export function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "11111111-1111-7111-8111-111111111111",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    role: "user",
    isVerified: true,
    departmentId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function fakeDepartment(overrides: Record<string, unknown> = {}) {
  return {
    departmentId: "22222222-2222-7222-8222-222222222222",
    departmentName: "Facilities",
    departmentEmail: "facilities@example.com",
    managedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function fakeTicket(overrides: Record<string, unknown> = {}) {
  const department = fakeDepartment();
  const creator = fakeUser();
  return {
    ticketId: "33333333-3333-7333-8333-333333333333",
    title: "Printer is on fire",
    description: "Smoke coming from the third floor printer.",
    status: "open",
    priority: "medium",
    departmentId: department.departmentId,
    department,
    assignedToId: null,
    assignedTo: null,
    createdById: creator.id,
    createdBy: creator,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    closedAt: null,
    ...overrides,
  };
}
