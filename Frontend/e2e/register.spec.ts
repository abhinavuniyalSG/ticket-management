import { test, expect } from "@playwright/test";
import { fakeUser, mockLoggedOut } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockLoggedOut(page);
  await page.goto("/register");
});

test("disables Create account until first name, email, and a matching valid password are all filled in", async ({
  page,
}) => {
  await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();

  await page.getByLabel("First name").fill("Ada");
  await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();

  await page.getByLabel("Email").fill("ada@example.com");
  await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();

  await page.getByRole("textbox", { name: "Password", exact: true }).fill("Str0ng!Pass");
  await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();

  await page.getByLabel("Confirm password").fill("Str0ng!Pass");
  await expect(page.getByRole("button", { name: "Create account" })).toBeEnabled();
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

test("validates first name and email on blur, not before, and clears live once fixed", async ({
  page,
}) => {
  const firstName = page.getByLabel("First name");
  const email = page.getByLabel("Email");

  // Typing alone doesn't trigger the error - only leaving the field does.
  await firstName.click();
  await email.click(); // blurs First name while still empty
  await expect(page.getByText("First name is required")).toBeVisible();

  await email.fill("not-an-email");
  await firstName.click(); // blurs Email
  await expect(page.getByText("Enter a valid email address")).toBeVisible();

  // Fixing it clears the error immediately, without another blur.
  await firstName.fill("Ada");
  await expect(page.getByText("First name is required")).not.toBeVisible();
  await email.fill("ada@example.com");
  await expect(page.getByText("Enter a valid email address")).not.toBeVisible();
});

test("confirm password mismatch stays hidden while typing and only appears after a pause or on blur", async ({
  page,
}) => {
  const password = page.getByRole("textbox", { name: "Password", exact: true });
  const confirmPassword = page.getByLabel("Confirm password");

  await password.fill("Str0ng!Pass");
  await confirmPassword.pressSequentially("Different1!", { delay: 20 });

  // Still within the debounce window right after typing - not shown yet.
  await expect(page.getByText("Passwords do not match")).not.toBeVisible();

  // Blurring away reveals it immediately, without waiting out the debounce.
  await password.click();
  await expect(page.getByText("Passwords do not match")).toBeVisible();

  // Resuming typing hides it again until the next pause/blur.
  await confirmPassword.pressSequentially("x", { delay: 20 });
  await expect(page.getByText("Passwords do not match")).not.toBeVisible();
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
