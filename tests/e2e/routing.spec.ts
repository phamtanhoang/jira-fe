import { test, expect } from "@playwright/test";

/**
 * E2E tests for routing and middleware auth guard.
 *
 * Middleware checks COOKIE_AUTH — without it, protected routes redirect
 * to /sign-in. These tests verify that behavior without hitting any API.
 */
test.describe("Routing & auth guard", () => {
  test("unauthenticated visit to / redirects to sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("unauthenticated visit to /dashboard redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("unauthenticated visit to /workspaces redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/workspaces");
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("sign-up page is publicly accessible", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(
      page.getByRole("heading", { name: /sign up/i }),
    ).toBeVisible();
  });
});
