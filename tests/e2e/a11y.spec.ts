import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility smoke tests using @axe-core/playwright.
 *
 * Covers public auth pages — these are the surface most likely to be hit by
 * unauthenticated users (incl. screen-reader users on first visit). Pages
 * past auth need fixtures / login flow; those are deferred to a follow-up
 * once the test sign-in fixture lands.
 *
 * To run: `npm run e2e -- a11y.spec.ts`
 *
 * NOTE: requires `@axe-core/playwright` installed:
 *   npm install -D @axe-core/playwright
 */
const PUBLIC_PAGES = [
  { name: "Sign-in", path: "/sign-in" },
  { name: "Sign-up", path: "/sign-up" },
  { name: "Forgot password", path: "/forgot-password" },
] as const;

for (const { name, path } of PUBLIC_PAGES) {
  test(`${name} — no critical/serious WCAG 2.1 AA violations`, async ({
    page,
  }) => {
    await page.goto(path);
    // Wait for the form to render so we don't audit a half-loaded skeleton.
    await page
      .getByRole("button", { name: /sign|continue|submit|reset/i })
      .first()
      .waitFor({ timeout: 5000 })
      .catch(() => {
        // Some auth pages don't have a generic submit label — that's fine.
      });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Filter to actionable severity. Minor / moderate noise is informational
    // (e.g., color-contrast on disabled buttons) and shouldn't block the
    // build — log them so devs can chip away over time.
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    if (blocking.length > 0) {
      // Pretty-print which rules failed and the first node selector for each.
      console.error(
        `${name} a11y violations:`,
        blocking.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          firstNode: v.nodes[0]?.target,
        })),
      );
    }

    expect(blocking).toEqual([]);
  });
}
