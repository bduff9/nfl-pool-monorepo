import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { google } from "@/lib/auth";

export const GET = async (_req: NextRequest, _ctx: RouteContext<"/login/google">): Promise<Response> => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);
  const cookieStore = await cookies();

  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  cookieStore.set("google_code_verifier", codeVerifier, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return new Response(null, {
    headers: {
      Location: url.toString(),
    },
    status: 302,
  });
};
