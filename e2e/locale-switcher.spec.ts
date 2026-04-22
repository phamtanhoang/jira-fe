import { test, expect } from "@playwright/test";

/**
 * E2E test for the locale switcher on the auth layout.
 * Pure client-side — no API needed.
 */
test.describe("Locale switcher", () => {
  test("switches between Vietnamese and English on the sign-in page", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    // Default locale is "en" — expect English heading "Sign In"
    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible();

    // Open the locale switcher (trigger shows "EN")
    await page.getByRole("button", { name: /EN/i }).click();

    // Click "Tiếng Việt" to switch locale
    await page.getByText("Tiếng Việt").click();

    // Heading should now be the Vietnamese equivalent "Đăng nhập"
    await expect(
      page.getByRole("heading", { name: /đăng nhập/i }),
    ).toBeVisible();
  });
});
