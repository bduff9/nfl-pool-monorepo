import { describe, expect, it } from "vitest";

import { getGoogleButtonTitle } from "./googleButtonTitle";

describe("getGoogleButtonTitle", () => {
  it("defaults to linking an account", () => {
    expect(getGoogleButtonTitle({})).toBe("Link Google account");
  });

  it("shows linked once the account is linked", () => {
    expect(getGoogleButtonTitle({ isLinked: true })).toBe("Google linked");
  });

  it("uses sign-in wording and ignores isLinked when signing in", () => {
    expect(getGoogleButtonTitle({ isSignIn: true })).toBe("Sign in with Google");
    expect(getGoogleButtonTitle({ isLinked: true, isSignIn: true })).toBe("Sign in with Google");
  });

  it("uses register wording when signing in to register", () => {
    expect(getGoogleButtonTitle({ isRegister: true, isSignIn: true })).toBe("Register with Google");
  });

  it("ignores isRegister outside of sign-in", () => {
    expect(getGoogleButtonTitle({ isRegister: true })).toBe("Link Google account");
  });
});
