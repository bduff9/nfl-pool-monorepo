"use server";

import { cookies } from "next/headers";
import "server-only";

import { google } from "@/lib/auth";
import { generateGoogleCodeVerifier, generateGoogleOAuthState } from "@/lib/googleOAuth";

export const getGoogleAuthorizationUrl = async (): Promise<string> => {
  const state = generateGoogleOAuthState();
  const codeVerifier = generateGoogleCodeVerifier();
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

  return url.toString();
};
