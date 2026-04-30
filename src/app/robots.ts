import type { MetadataRoute } from "next";

/**
 * Crawler policy. Most of the app sits behind auth — no point indexing
 * `/dashboard` or `/workspaces/...`. We expose only the marketing landing
 * page (currently the auth gate) and disallow private routes explicitly so
 * compliance crawlers respect them.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jira.example.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/sign-in", "/sign-up"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/dashboard",
          "/workspaces",
          "/profile",
          "/notifications",
          "/issues/",
          "/u/",
          "/share/", // share tokens are private — noindex even if URL leaks
          "/join/",
          "/maintenance",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
