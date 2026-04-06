import { NextRequest, NextResponse } from "next/server";
import { ROUTES, PUBLIC_ROUTES } from "@/lib/constants";

export function middleware(request: NextRequest) {
  const isAuthenticated =
    request.cookies.get("is_authenticated")?.value === "1";
  const pathname = request.nextUrl.pathname;

  // Public pages — redirect to dashboard if already logged in
  if (
    (PUBLIC_ROUTES as readonly string[]).includes(pathname) &&
    isAuthenticated
  ) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  // Protected pages — redirect to sign-in if not logged in
  if (
    !(PUBLIC_ROUTES as readonly string[]).includes(pathname) &&
    !isAuthenticated
  ) {
    return NextResponse.redirect(new URL(ROUTES.SIGN_IN, request.url));
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)"],
};
