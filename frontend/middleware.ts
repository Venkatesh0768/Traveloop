import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge Middleware — Server-side route protection.
 *
 * Only blocks unauthenticated users from accessing protected routes.
 * We do NOT redirect authenticated users away from /login or /register —
 * the cookie may be expired/invalid, and AuthContext handles that case
 * client-side after a failed refresh attempt.
 *
 * Route rules:
 * - /dashboard, /profile, /admin → require refreshToken cookie → redirect /login
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshToken = request.cookies.has("refreshToken");

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin");

  // Only block access to protected routes when there's no cookie at all.
  // If the cookie exists but is expired, AuthContext will handle the redirect
  // after the refresh attempt fails on the client side.
  if (isProtectedRoute && !hasRefreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
