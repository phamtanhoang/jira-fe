import type { Metadata } from "next";
import { ENV } from "@/lib/constants";
import PublicIssuePage from "./client";

type Params = Promise<{ token: string }>;

type SharedIssue = {
  key: string;
  summary: string;
};

/**
 * Server-side fetch the public issue payload to populate proper Open Graph
 * tags (Slack/Twitter/LinkedIn cards). The endpoint requires no auth — it's
 * gated by token existence + expiry on the BE side. If the fetch fails (404,
 * expired, network), we fall back to generic metadata so the page still
 * renders.
 */
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;

  let issue: SharedIssue | null = null;
  try {
    const res = await fetch(`${ENV.API_URL}/public/issues/${token}`, {
      // 5-minute revalidate — share-link metadata rarely changes once issued.
      // Keeps social-card scrapers from hammering BE.
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = (await res.json()) as Partial<SharedIssue>;
      if (data.key && data.summary) {
        issue = { key: data.key, summary: data.summary };
      }
    }
  } catch {
    // Swallow — fallback metadata is already correct for the failure case.
  }

  const title = issue ? `${issue.key} · ${issue.summary}` : "Shared issue";
  const description = issue
    ? `${issue.key} — read-only public view`
    : "Read-only public view of an issue";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default PublicIssuePage;
