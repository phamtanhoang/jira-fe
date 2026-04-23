import { NextRequest, NextResponse } from "next/server";
import { ROUTES, PUBLIC_ROUTES, COOKIE_AUTH } from "@/lib/constants";

type MaintenanceValue = {
  enabled: boolean;
  message?: string;
  allowedEmails?: string[];
};

/**
 * Paths that MUST stay reachable while maintenance mode is enabled so the
 * admin can still log in and turn it off.
 */
const MAINTENANCE_ALLOWLIST = [
  ROUTES.MAINTENANCE,
  ROUTES.SIGN_IN,
  ROUTES.SIGN_UP,
  ROUTES.VERIFY_EMAIL,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];

async function fetchMaintenance(): Promise<MaintenanceValue | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return null;
    const res = await fetch(`${apiUrl}/settings/app-maintenance`, {
      // Edge fetch — keep it fast and cheap; 30s is short enough to react
      // quickly to admin toggling the flag, long enough to not hammer BE.
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return (await res.json()) as MaintenanceValue | null;
  } catch {
    return null;
  }
}

function isAdminPath(pathname: string): boolean {
  return pathname === ROUTES.ADMIN || pathname.startsWith(`${ROUTES.ADMIN}/`);
}

function isAllowlistedDuringMaintenance(pathname: string): boolean {
  if (isAdminPath(pathname)) return true;
  return (MAINTENANCE_ALLOWLIST as readonly string[]).includes(pathname);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthenticated = request.cookies.get(COOKIE_AUTH)?.value === "1";

  // Maintenance gate — runs BEFORE auth checks so unauthenticated visitors
  // land on the maintenance page instead of the sign-in form.
  if (!isAllowlistedDuringMaintenance(pathname)) {
    const maintenance = await fetchMaintenance();
    if (maintenance?.enabled) {
      return NextResponse.redirect(new URL(ROUTES.MAINTENANCE, request.url));
    }
  }

  // Public pages — redirect to dashboard if already logged in
  if (
    (PUBLIC_ROUTES as readonly string[]).includes(pathname) &&
    isAuthenticated
  ) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  // Maintenance page itself is open to everyone
  if (pathname === ROUTES.MAINTENANCE) return;

  // Protected pages — redirect to sign-in if not logged in
  if (
    !(PUBLIC_ROUTES as readonly string[]).includes(pathname) &&
    !isAuthenticated
  ) {
    return NextResponse.redirect(new URL(ROUTES.SIGN_IN, request.url));
  }
}

export const config = {
  matcher: ["/((?!api|.+\\.[\\w]+$|_next).*)"],
};
