import { describe, expect, it } from "vitest";

import { getLoginSubmitLabel, getPostLoginRoute } from "./loginFormHelpers";

describe("getPostLoginRoute", () => {
  it("uses a non-empty string redirect", () => {
    expect(getPostLoginRoute("/picks")).toBe("/picks");
  });

  it.each([[undefined], [null], [""], [5], [{}]])("falls back to the home route for %j", (value) => {
    expect(getPostLoginRoute(value)).toBe("/");
  });
});

describe("getLoginSubmitLabel", () => {
  it("labels the login button", () => {
    expect(getLoginSubmitLabel(true, false, false)).toBe("Login");
    expect(getLoginSubmitLabel(true, true, false)).toBe("Logging in...");
  });

  it("labels the register button", () => {
    expect(getLoginSubmitLabel(false, false, false)).toBe("Register");
    expect(getLoginSubmitLabel(false, false, true)).toBe("Registering...");
  });

  it("only reflects the pending state of the active mode", () => {
    expect(getLoginSubmitLabel(true, false, true)).toBe("Login");
    expect(getLoginSubmitLabel(false, true, false)).toBe("Register");
  });
});
