import { test, expect } from "@playwright/test";
import { fakeUser, mockLoggedIn } from "./fixtures";

// Routes are scoped to "**/api/..." rather than just "**/users*" etc.
// because page.goto() performs a real HTTP navigation to
// http://localhost:5173/users, which would otherwise also match a bare
// "**/users*" glob and get intercepted instead of loading the app.

test("an admin can view the users list and open a user's details page", async ({ page }) => {
  const actor = fakeUser({ id: "admin-1", role: "admin" });
  const target = fakeUser({
    id: "target-1",
    firstName: "Grace",
    lastName: "Hopper",
    email: "grace@example.com",
    role: "user",
  });

  await mockLoggedIn(page, actor);
  await page.route("**/api/users*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", users: [target] } }),
  );
  await page.route("**/api/users/target-1", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", user: target } }),
  );
  await page.route("**/api/departments*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", departments: [] } }),
  );

  await page.goto("/users");
  await expect(page.getByRole("link", { name: "Grace Hopper" })).toBeVisible();

  await page.getByRole("link", { name: "Grace Hopper" }).click();

  await expect(page).toHaveURL("/users/target-1");
  await expect(page.getByRole("heading", { name: "Grace Hopper" })).toBeVisible();
});

test("a super_admin can view the users list and open a user's details page", async ({ page }) => {
  const actor = fakeUser({ id: "super-1", role: "super_admin" });
  const target = fakeUser({
    id: "target-2",
    firstName: "Alan",
    lastName: "Turing",
    email: "alan@example.com",
    role: "admin",
  });

  await mockLoggedIn(page, actor);
  await page.route("**/api/users*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", users: [target] } }),
  );
  await page.route("**/api/users/target-2", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", user: target } }),
  );
  await page.route("**/api/departments*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", departments: [] } }),
  );

  await page.goto("/users");
  await expect(page.getByRole("link", { name: "Alan Turing" })).toBeVisible();

  await page.getByRole("link", { name: "Alan Turing" }).click();

  await expect(page).toHaveURL("/users/target-2");
  await expect(page.getByRole("heading", { name: "Alan Turing" })).toBeVisible();
});
