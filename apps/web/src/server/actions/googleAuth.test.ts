import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesSet = vi.fn();
const generateState = vi.fn();
const generateCodeVerifier = vi.fn();
const createAuthorizationURL = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookiesSet }),
}));
vi.mock("arctic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("arctic")>();

  return { ...actual, generateCodeVerifier, generateState };
});
vi.mock("@/lib/auth", () => ({
  google: { createAuthorizationURL },
}));

describe("getGoogleAuthorizationUrl", () => {
  beforeEach(() => {
    cookiesSet.mockReset();
    generateState.mockReset().mockReturnValue("test-state");
    generateCodeVerifier.mockReset().mockReturnValue("test-verifier");
    createAuthorizationURL.mockReset().mockReturnValue(new URL("https://accounts.google.com/o/oauth2/v2/auth?x=1"));
    vi.resetModules();
  });

  it("sets state and code verifier cookies and returns the authorization URL", async () => {
    const { getGoogleAuthorizationUrl } = await import("./googleAuth");
    const url = await getGoogleAuthorizationUrl();

    expect(url).toBe("https://accounts.google.com/o/oauth2/v2/auth?x=1");
    expect(createAuthorizationURL).toHaveBeenCalledWith("test-state", "test-verifier", ["openid", "profile", "email"]);
    expect(cookiesSet).toHaveBeenCalledWith(
      "google_oauth_state",
      "test-state",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(cookiesSet).toHaveBeenCalledWith(
      "google_code_verifier",
      "test-verifier",
      expect.objectContaining({ httpOnly: true }),
    );
  });
});
