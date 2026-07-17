import {
  handleRootRedirect,
  isAdminRoute,
  isAppRoute,
  isFreelanceRoute,
  redirectToSignIn,
  redirectToUnauthorized,
  validateSession,
} from "@/lib/middleware-utils";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isProductPathAvailable } from "@/config/product-features";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return handleRootRedirect(request) ?? NextResponse.next();
  }

  if (isAppRoute(pathname)) {
    const session = await validateSession(request);
    if (!session) {
      return redirectToSignIn(request);
    }
  }

  if (isFreelanceRoute(pathname)) {
    const session = await validateSession(request);
    if (!session) {
      return redirectToSignIn(request);
    }
  }

  if (isAdminRoute(pathname)) {
    const session = await validateSession(request);
    if (!session) {
      return redirectToSignIn(request);
    }

    if (session.user.role !== "admin") {
      return redirectToUnauthorized(request);
    }
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
