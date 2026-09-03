import { test, expect } from "@playwright/test";
import { fakeUser, mockLoggedIn } from "./fixtures";

// Routes are scoped to "**/api/..." rather than just "**/tickets*" etc.
// because page.goto() performs a real HTTP navigation to
// http://localhost:5173/tickets, which would otherwise also match a bare
// "**/tickets*" glob and get intercepted instead of loading the app.

async function mockEmptyDepartments(page: import("@playwright/test").Page) {
  await page.route("**/api/departments*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", departments: [] } }),
  );
}

async function mockEmptyUsers(page: import("@playwright/test").Page) {
  await page.route("**/api/users*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", users: [] } }),
  );
}

async function mockEmptyTickets(page: import("@playwright/test").Page) {
  await page.route("**/api/tickets*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", tickets: [] } }),
  );
}

async function mockDashboard(page: import("@playwright/test").Page) {
  const metrics = {
    message: "OK",
    totalTickets: 0,
    openTickets: 0,
    assignedTickets: 0,
    inProgressTickets: 0,
    reviewedTickets: 0,
    completedTickets: 0,
    closedTickets: 0,
    statusDistribution: [],
    priorityDistribution: [],
    productivity: { averageCompletionTimeHours: 0 },
    ticketsOverTime: [],
  };
  await page.route("**/api/dashboard/overview", (route) =>
    route.fulfill({
      status: 200,
      json: { message: "OK", systemWide: metrics, departments: [] },
    }),
  );
  await page.route("**/api/dashboard*", (route) =>
    route.fulfill({ status: 200, json: metrics }),
  );
}

test.describe("plain user role", () => {
  test.beforeEach(async ({ page }) => {
    await mockLoggedIn(page, fakeUser({ role: "user" }));
  });

  test("is redirected to /unauthorized when visiting the dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/unauthorized");
  });

  test("is redirected to /unauthorized when visiting users", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL("/unauthorized");
  });

  test("is redirected to /unauthorized when visiting departments", async ({ page }) => {
    await page.goto("/departments");
    await expect(page).toHaveURL("/unauthorized");
  });

  test("visiting root redirects to the tickets list", async ({ page }) => {
    await mockEmptyTickets(page);
    await page.goto("/");
    await expect(page).toHaveURL("/tickets");
  });
});

test.describe("admin role", () => {
  test.beforeEach(async ({ page }) => {
    await mockLoggedIn(page, fakeUser({ role: "admin" }));
  });

  test("is redirected to /unauthorized when visiting departments", async ({ page }) => {
    await page.goto("/departments");
    await expect(page).toHaveURL("/unauthorized");
  });
});

test.describe("super_admin role", () => {
  test.beforeEach(async ({ page }) => {
    await mockLoggedIn(page, fakeUser({ role: "super_admin" }));
  });

  test("can reach the dashboard", async ({ page }) => {
    await mockDashboard(page);
    await mockEmptyDepartments(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("can reach the users list", async ({ page }) => {
    await mockEmptyUsers(page);
    await mockEmptyDepartments(page);
    await page.goto("/users");
    await expect(page).toHaveURL("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });

  test("can reach the departments list", async ({ page }) => {
    await mockEmptyDepartments(page);
    await mockEmptyUsers(page);
    await page.goto("/departments");
    await expect(page).toHaveURL("/departments");
    await expect(page.getByRole("heading", { name: "Departments" })).toBeVisible();
  });

  test("visiting root redirects to the dashboard", async ({ page }) => {
    await mockDashboard(page);
    await mockEmptyDepartments(page);
    await page.goto("/");
    await expect(page).toHaveURL("/dashboard");
  });
});
