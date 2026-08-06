import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REDIRECT_TO_SKIP_PREFIXES = ["/_next", "/api", "/auth", "/login"];
const HAS_FILE_EXTENSION = /\.[a-zA-Z0-9]+$/;

export const proxy = (request: NextRequest): NextResponse => {
  if (request.method === "GET" || request.method === "HEAD") {
    const response = NextResponse.next();
    const token = request.cookies.get("session")?.value ?? null;

    if (token !== null) {
      response.cookies.set("session", token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    } else {
      const { pathname, search } = request.nextUrl;
      const isSkippedPath =
        REDIRECT_TO_SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || HAS_FILE_EXTENSION.test(pathname);

      if (!isSkippedPath) {
        response.cookies.set("redirect_to", `${pathname}${search}`, {
          httpOnly: true,
          maxAge: 60 * 10,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
    }

    return response;
  }

  const originHeader = request.headers.get("Origin");
  const hostHeader = request.headers.get("Host");

  if (originHeader === null || hostHeader === null) {
    return new NextResponse(null, {
      status: 403,
    });
  }

  let origin: URL;

  try {
    origin = new URL(originHeader);
  } catch {
    return new NextResponse(null, {
      status: 403,
    });
  }

  if (origin.host !== hostHeader) {
    return new NextResponse(null, {
      status: 403,
    });
  }

  return NextResponse.next();
};
