import { test, expect } from "@playwright/test";
import { fakeDepartment, fakeUser, mockLoggedIn } from "./fixtures";

// Routes are scoped to "**/api/..." rather than just "**/departments*" etc.
// because page.goto() performs a real HTTP navigation to
// http://localhost:5173/departments, which would otherwise also match a
// bare "**/departments*" glob and get intercepted instead of loading the app.

test.beforeEach(async ({ page }) => {
  await mockLoggedIn(page, fakeUser({ role: "super_admin" }));
});

test("a super_admin can view the departments list and open a department's details page", async ({
  page,
}) => {
  const department = fakeDepartment({
    departmentId: "dept-1",
    departmentName: "Facilities",
    departmentEmail: "facilities@example.com",
  });

  await page.route("**/api/departments*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", departments: [department] } }),
  );
  await page.route("**/api/departments/dept-1", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", department } }),
  );
  await page.route("**/api/users*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", users: [] } }),
  );

  await page.goto("/departments");
  await expect(page.getByRole("link", { name: "Facilities" })).toBeVisible();

  await page.getByRole("link", { name: "Facilities" }).click();

  await expect(page).toHaveURL("/departments/dept-1");
  await expect(page.getByRole("heading", { name: "Facilities" })).toBeVisible();
});

test("shows an empty state when there are no departments", async ({ page }) => {
  await page.route("**/api/departments*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", departments: [] } }),
  );
  await page.route("**/api/users*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", users: [] } }),
  );

  await page.goto("/departments");

  await expect(page.getByText("No departments found")).toBeVisible();
});
