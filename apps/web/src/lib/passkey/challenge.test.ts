import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesGet = vi.fn();
const cookiesSet = vi.fn();

vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookiesGet, set: cookiesSet }) }));

import {
  authenticationChallengeIdentifier,
  clearChallengeCookie,
  generateChallengeId,
  getChallengeExpiry,
  readChallengeCookie,
  registrationChallengeIdentifier,
  setChallengeCookie,
} from "./challenge";

describe("challenge identifiers", () => {
  it("namespaces registration challenges by user and authentication challenges by random id", () => {
    expect(registrationChallengeIdentifier(7)).toBe("passkey-reg:7");
    expect(authenticationChallengeIdentifier("abc")).toBe("passkey-auth:abc");
  });

  it("generates unguessable, url-safe, unique challenge ids", () => {
    const ids = new Set(Array.from({ length: 50 }, generateChallengeId));

    expect(ids.size).toBe(50);
    for (const id of ids) {
      expect(id).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
  });

  it("expires challenges after five minutes", () => {
    expect(getChallengeExpiry(1_000).getTime()).toBe(1_000 + 5 * 60 * 1000);
  });
});

describe("challenge cookie", () => {
  beforeEach(() => {
    cookiesGet.mockReset();
    cookiesSet.mockReset();
  });

  it("sets an httpOnly, sameSite=lax, short-lived cookie holding only the challenge id", async () => {
    await setChallengeCookie("abc");

    expect(cookiesSet).toHaveBeenCalledWith("passkey_challenge", "abc", {
      httpOnly: true,
      maxAge: 300,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
  });

  it("is secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await setChallengeCookie("abc");
    vi.unstubAllEnvs();

    expect(cookiesSet.mock.calls[0]?.[2]).toMatchObject({ secure: true });
  });

  it("reads and clears the cookie", async () => {
    cookiesGet.mockReturnValue({ value: "abc" });

    expect(await readChallengeCookie()).toBe("abc");

    await clearChallengeCookie();

    expect(cookiesSet).toHaveBeenCalledWith("passkey_challenge", "", expect.objectContaining({ maxAge: 0 }));
  });
});
