import type { MetadataRoute } from "next";

/**
 * Sitemap for marketing-discoverable routes only. The app is auth-gated, so
 * everything past sign-in stays out of the sitemap to avoid bot flooding +
 * privacy leaks (workspace/project IDs in URLs).
 *
 * Override base URL via `NEXT_PUBLIC_APP_URL` (production deploy) — falls
 * back to a placeholder so dev `npm run build` doesn't crash.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jira.example.com";
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
