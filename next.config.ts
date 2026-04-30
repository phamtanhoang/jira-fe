import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { ENV } from "./src/lib/constants/env";

// Enable with: ANALYZE=true npm run build
// Output: .next/analyze/{client,server}.html — open in browser to inspect.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  output: "standalone",
  rewrites: async () => [
    {
      source: "/api/:path*",
      destination: `${ENV.API_URL}/:path*`,
    },
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        // Pragmatic CSP — relaxes `script-src` enough for Next.js inline
        // hydration scripts (`'unsafe-inline'`), but still blocks third-party
        // scripts. `connect-src` allows the rewrite target + Sentry + a wide
        // `https:` for Supabase signed URLs whose hostname rotates. Tightening
        // to nonces would require app-router CSP middleware — defer.
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://browser.sentry-cdn.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https: wss:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
          ].join("; "),
        },
      ],
    },
  ],
};

// Sentry build-plugin wrap. When `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` +
// `SENTRY_PROJECT` are set at build time (production CI), the plugin
// uploads sourcemaps + tags the release with the git SHA so Sentry shows
// readable stack frames. Missing env vars → plugin no-ops, no build error.
// `silent` keeps dev build logs clean.
export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  release: {
    name: process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA,
  },
  // Smaller bundles for end users — sourcemaps stay on the server side.
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  disableLogger: true,
});

