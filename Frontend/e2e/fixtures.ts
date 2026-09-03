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
