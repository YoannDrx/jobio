import { SiteConfig } from "@/site-config";
import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const handleRootRedirect = (request: NextRequest) => {
  if (!SiteConfig.features.enableLandingRedirection) return null;

  const session = getSessionCookie(request, {
    cookiePrefix: SiteConfig.appId,
  });

  if (!session) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/job";
  return NextResponse.redirect(url);
};

export const isAppRoute = (pathname: string) => {
  return pathname.startsWith("/job");
};

export const isAdminRoute = (pathname: string) => {
  return pathname.startsWith("/admin");
};

export const isFreelanceRoute = (pathname: string) => {
  return pathname.startsWith("/freelance");
};

// The proxy only performs a cheap presence check. Every protected page and
// server action validates the signed session against Better Auth server-side.
// Keeping the Prisma-backed auth instance out of the proxy prevents the whole
// repository from being traced into the middleware bundle.
export const hasSessionCookie = (request: NextRequest): boolean =>
  Boolean(
    getSessionCookie(request, {
      cookiePrefix: SiteConfig.appId,
    }),
  );

export const redirectToSignIn = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/signin";
  return NextResponse.redirect(url);
};
