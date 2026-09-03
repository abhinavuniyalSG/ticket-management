import { test, expect } from "@playwright/test";
import { fakeUser, mockLoggedOut } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockLoggedOut(page);
});

test("shows validation errors when the form is submitted empty", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Email is required")).toBeVisible();
  await expect(page.getByText("Password is required")).toBeVisible();
});

test("shows an error message when the backend rejects the credentials", async ({ page }) => {
  await page.route("**/auth/login", (route) =>
    route.fulfill({ status: 401, json: { message: "Invalid email or password" } }),
  );

  await page.goto("/login");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("alert")).toContainText("Invalid email or password");
});

test("logs in and redirects to the tickets list", async ({ page }) => {
  await page.route("**/auth/login", (route) =>
    route.fulfill({
      status: 200,
      json: { message: "Logged in", user: fakeUser({ role: "user", isVerified: true }) },
    }),
  );
  await page.route("**/tickets*", (route) =>
    route.fulfill({ status: 200, json: { message: "OK", tickets: [] } }),
  );

  await page.goto("/login");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("Str0ng!Pass");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/tickets");
});

test("an unverified account is sent to the verification page instead of the app", async ({
  page,
}) => {
  await page.route("**/auth/login", (route) =>
    route.fulfill({
      status: 200,
      json: { message: "Logged in", user: fakeUser({ isVerified: false }) },
    }),
  );

  await page.goto("/login");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("Str0ng!Pass");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/verify-required");
});
