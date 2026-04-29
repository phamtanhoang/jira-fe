import { NextRequest, NextResponse } from "next/server";
import {
  ENV,
  ROUTES,
  PUBLIC_ROUTES,
  COOKIE_AUTH,
  COOKIE_ROLE,
} from "@/lib/constants";

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

// 5-minute edge cache. Every non-admin navigation passes through this
// middleware, so a short revalidate means BE gets hit once per region per
// cache miss. Maintenance is toggled rarely — a few-minute lag before users
// see the maintenance page is an acceptable trade for ~10x fewer BE calls.
const MAINTENANCE_REVALIDATE_SEC = 300;

async function fetchMaintenance(): Promise<MaintenanceValue | null> {
  try {
    const res = await fetch(`${ENV.API_URL}/settings/app-maintenance`, {
      next: { revalidate: MAINTENANCE_REVALIDATE_SEC },
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

// Public share links — token-based, dynamic path. Must reach the page even
// without auth (and without redirecting through sign-in). Also bypassed
// during maintenance because external recipients shouldn't see the
// maintenance page when the org-internal site is down.
function isPublicShareRoute(pathname: string): boolean {
  return pathname.startsWith("/share/");
}

function isAllowlistedDuringMaintenance(pathname: string): boolean {
  if (isAdminPath(pathname)) return true;
  if (isPublicShareRoute(pathname)) return true;
  return (MAINTENANCE_ALLOWLIST as readonly string[]).includes(pathname);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthenticated = request.cookies.get(COOKIE_AUTH)?.value === "1";
  const role = request.cookies.get(COOKIE_ROLE)?.value;
  const isAdmin = role === "ADMIN";

  // Maintenance gate — runs BEFORE auth checks so unauthenticated visitors
  // land on the maintenance page instead of the sign-in form. Admins bypass
  // entirely so they can continue browsing and turn maintenance off.
  if (!isAdmin && !isAllowlistedDuringMaintenance(pathname)) {
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

  // Maintenance page + public share links are open to everyone
  if (pathname === ROUTES.MAINTENANCE) return;
  if (isPublicShareRoute(pathname)) return;

  // Protected pages — redirect to sign-in if not logged in
  if (
    !(PUBLIC_ROUTES as readonly string[]).includes(pathname) &&
    !isAuthenticated
  ) {
    return NextResponse.redirect(new URL(ROUTES.SIGN_IN, request.url));
  }

  return;
}

export const config = {
  matcher: ["/((?!api|.+\\.[\\w]+$|_next).*)"],
};
