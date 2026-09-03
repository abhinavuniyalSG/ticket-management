import { test, expect } from "@playwright/test";
import { mockLoggedOut } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockLoggedOut(page);
});

test("redirects an unauthenticated visitor from a protected page to login", async ({ page }) => {
  await page.goto("/tickets");

  await expect(page).toHaveURL("/login");
});

test("redirects an unauthenticated visitor from the root URL to login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL("/login");
});

test("an unknown route shows the 404 page with a way back home", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");

  await expect(page.getByText("Page not found")).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to home" })).toBeVisible();
});
