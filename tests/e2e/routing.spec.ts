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

  test("unauthenticated visit to user profile redirects to sign-in", async ({
    page,
  }) => {
    // The /u/[userId] route is auth-gated — middleware should bounce the
    // request to /sign-in regardless of whether the user id is valid.
    await page.goto("/u/2ca34996-9116-4eb8-ad51-f9e8dbdfeb9e");
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("public share-link route bypasses auth guard", async ({ page }) => {
    // Token routes must reach the page even without COOKIE_AUTH so external
    // recipients can open shared issues. We only assert the URL stays put;
    // the page itself fetches and may render an "expired" state.
    await page.goto("/share/issue/test-token-not-real");
    await expect(page).toHaveURL(/\/share\/issue\/test-token-not-real$/);
  });

  test("maintenance page reachable without auth", async ({ page }) => {
    await page.goto("/maintenance");
    await expect(page).toHaveURL(/\/maintenance$/);
  });
});
