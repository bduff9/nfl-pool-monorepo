import { createHash, randomBytes } from "node:crypto";

import { type } from "arktype";

import "server-only";

/**
 * Minimal Google OAuth 2.0 + PKCE client, vendored after `arctic` and `@oslojs/crypto` were
 * both deprecated by their author with no maintained successor package.
 */

const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export type GoogleTokens = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  idToken: string;
};

const createS256CodeChallenge = (codeVerifier: string): string =>
  createHash("sha256").update(codeVerifier).digest("base64url");

export const generateGoogleOAuthState = (): string => randomBytes(32).toString("base64url");

export const generateGoogleCodeVerifier = (): string => randomBytes(32).toString("base64url");

export const decodeGoogleIdToken = (idToken: string): unknown => {
  const parts = idToken.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid ID token");
  }

  return JSON.parse(Buffer.from(parts[1] ?? "", "base64url").toString("utf8"));
};

const tokenResponseSchema = type({
  access_token: "string",
  expires_in: "number",
  id_token: "string",
});

const parseTokenResponse = async (response: Response): Promise<GoogleTokens> => {
  if (!response.ok) {
    throw new Error(`Google OAuth token request failed: ${response.status}`);
  }

  const result = tokenResponseSchema(await response.json());

  if (result instanceof type.errors) {
    throw new Error(`Google OAuth token response missing required fields: ${result.summary}`);
  }

  return {
    accessToken: result.access_token,
    accessTokenExpiresAt: new Date(Date.now() + result.expires_in * 1000),
    idToken: result.id_token,
  };
};

export class GoogleOAuthClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectURI: string;

  constructor(clientId: string, clientSecret: string, redirectURI: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectURI = redirectURI;
  }

  createAuthorizationURL(state: string, codeVerifier: string, scopes: string[]): URL {
    const url = new URL(AUTHORIZATION_ENDPOINT);

    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectURI);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", createS256CodeChallenge(codeVerifier));

    if (scopes.length > 0) {
      url.searchParams.set("scope", scopes.join(" "));
    }

    return url;
  }

  async validateAuthorizationCode(code: string, codeVerifier: string): Promise<GoogleTokens> {
    const body = new URLSearchParams();

    body.set("grant_type", "authorization_code");
    body.set("code", code);
    body.set("redirect_uri", this.redirectURI);
    body.set("code_verifier", codeVerifier);

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const response = await fetch(TOKEN_ENDPOINT, {
      body,
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    return parseTokenResponse(response);
  }
}
