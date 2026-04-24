import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Internal cache-bust endpoint. Called by admin mutations after updating
 * settings that are SSR-rendered (app-info logo/name/description) so the
 * Next.js ISR cache doesn't keep serving the previous value to new incognito
 * / fresh sessions for up to `revalidate` seconds.
 *
 * No auth: the worst case is a drive-by refresh of a public cache entry,
 * which is self-healing.
 */
export async function POST(req: Request) {
  const { tag } = (await req.json().catch(() => ({}))) as { tag?: string };
  if (!tag) {
    return NextResponse.json({ error: "tag required" }, { status: 400 });
  }
  revalidateTag(tag, "max");
  return NextResponse.json({ revalidated: true, tag });
}
