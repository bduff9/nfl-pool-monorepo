import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REDIRECT_TO_SKIP_PREFIXES = ["/_next", "/api", "/auth", "/login"];
// Requests that can still be in flight when a sign-out clears the cookie (the login page and its assets) must not renew
// it, or they bring the old cookie straight back
const NO_RENEWAL_PREFIXES = ["/_next", "/auth/login", "/auth/logout"];
const HAS_FILE_EXTENSION = /\.[a-zA-Z0-9]+$/;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const REDIRECT_MAX_AGE_SECONDS = 60 * 10;

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  maxAge,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
});

const isReadMethod = (method: string): boolean => method === "GET" || method === "HEAD";

// Visitors heading to the app, not to its own plumbing, are sent back there after signing in
const shouldRememberDestination = (pathname: string): boolean =>
  !(REDIRECT_TO_SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || HAS_FILE_EXTENSION.test(pathname));

const shouldRenewSession = (pathname: string): boolean =>
  !(NO_RENEWAL_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || HAS_FILE_EXTENSION.test(pathname));

const proxyRead = (request: NextRequest): NextResponse => {
  const response = NextResponse.next();
  const token = request.cookies.get("session")?.value ?? null;
  const { pathname, search } = request.nextUrl;

  if (token !== null) {
    if (shouldRenewSession(pathname)) {
      response.cookies.set("session", token, cookieOptions(SESSION_MAX_AGE_SECONDS));
    }

    return response;
  }

  if (shouldRememberDestination(pathname)) {
    response.cookies.set("redirect_to", `${pathname}${search}`, cookieOptions(REDIRECT_MAX_AGE_SECONDS));
  }

  return response;
};

const parseOrigin = (origin: string): URL | null => {
  try {
    return new URL(origin);
  } catch {
    return null;
  }
};

// Changes only count when they come from this site's own pages
const isSameSite = (originHeader: string | null, hostHeader: string | null): boolean => {
  if (originHeader === null || hostHeader === null) {
    return false;
  }

  return parseOrigin(originHeader)?.host === hostHeader;
};

const proxyChange = (request: NextRequest): NextResponse =>
  isSameSite(request.headers.get("Origin"), request.headers.get("Host"))
    ? NextResponse.next()
    : new NextResponse(null, { status: 403 });

export const proxy = (request: NextRequest): NextResponse =>
  isReadMethod(request.method) ? proxyRead(request) : proxyChange(request);

// Prefetches skip the proxy, so merely prefetching a link never overwrites where a signed-out visitor was headed. Next
// strips its router headers before the proxy runs, so only the matcher can tell a prefetch apart from a navigation.
export const config = {
  matcher: [
    {
      missing: [
        { key: "next-router-prefetch", type: "header" },
        { key: "purpose", type: "header", value: "prefetch" },
      ],
      source: "/:path*",
    },
  ],
};
