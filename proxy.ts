import {
  handleRootRedirect,
  hasSessionCookie,
  isAdminRoute,
  isAppRoute,
  isFreelanceRoute,
  redirectToSignIn,
} from "@/lib/middleware-utils";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isProductPathAvailable } from "@/config/product-features";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.headers.get("host") === "www.jobio.fr") {
    const canonical = request.nextUrl.clone();
    canonical.protocol = "https";
    canonical.hostname = "jobio.fr";
    canonical.port = "";
    return NextResponse.redirect(canonical, 308);
  }

  if (pathname === "/") {
    return handleRootRedirect(request) ?? NextResponse.next();
  }

  if (
    (isAppRoute(pathname) ||
      isFreelanceRoute(pathname) ||
      isAdminRoute(pathname)) &&
    !hasSessionCookie(request)
  ) {
    return redirectToSignIn(request);
  }

  if (
    (isAppRoute(pathname) || isFreelanceRoute(pathname)) &&
    !isProductPathAvailable(pathname)
  ) {
    const target = request.nextUrl.clone();
    target.pathname = "/job";
    target.search = "";
    target.searchParams.set("notice", "feature-unavailable");
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
