import { test, expect } from "@playwright/test";
import { fakeUser, mockLoggedOut } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockLoggedOut(page);
  await page.goto("/register");
});

test("requires a first name and a valid email before submitting", async ({ page }) => {
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("First name is required")).toBeVisible();
  await expect(page.getByText("Email is required")).toBeVisible();
});

test("shows the password requirements live and disables submit until they're met", async ({ page }) => {
  await page.getByLabel("First name").fill("Ada");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("weak");
  await page.getByLabel("Confirm password").fill("weak");

  // Shown as soon as it's typed, no submit click needed.
  await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();
});

test("flags mismatched passwords live and disables submit until they match", async ({ page }) => {
  await page.getByLabel("First name").fill("Ada");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("Str0ng!Pass");
  await page.getByLabel("Confirm password").fill("Different1!");

  await expect(page.getByText("Passwords do not match")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();

  // Fixing the mismatch re-enables the button without needing a submit click.
  await page.getByLabel("Confirm password").fill("Str0ng!Pass");
  await expect(page.getByText("Passwords do not match")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeEnabled();
});

test("creates an account and sends the user to check their email", async ({ page }) => {
  await page.route("**/auth/register", (route) =>
    route.fulfill({
      status: 201,
      json: { message: "Registered", user: fakeUser({ isVerified: false }) },
    }),
  );

  await page.getByLabel("First name").fill("Ada");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("Str0ng!Pass");
  await page.getByLabel("Confirm password").fill("Str0ng!Pass");

  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL("/verify-required");
});
