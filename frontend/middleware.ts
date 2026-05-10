import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshToken = request.cookies.has("refreshToken");

  // Public trip pages are accessible without auth
  if (pathname.startsWith("/public/trips/")) {
    return NextResponse.next();
  }

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/trips") ||
    pathname.startsWith("/cities") ||
    pathname.startsWith("/checklist") ||
    pathname.startsWith("/notes");

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
    "/trips/:path*",
    "/cities/:path*",
    "/checklist/:path*",
    "/notes/:path*",
    // /public/trips/* is intentionally NOT in the matcher — open to all
  ],
};
