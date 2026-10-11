import { describe, expect, it } from "vitest";

import { parseLoginSearchParams } from "./loginSearchParams";

describe("parseLoginSearchParams", () => {
  it("defaults to login with no error and not submitted", () => {
    expect(parseLoginSearchParams({})).toEqual({ errorMessage: undefined, hasSubmitted: false, isLogin: true });
  });

  it("switches to register only when register is Y", () => {
    expect(parseLoginSearchParams({ register: "Y" }).isLogin).toBe(false);
    expect(parseLoginSearchParams({ register: "N" }).isLogin).toBe(true);
  });

  it("uses the first value of repeated params", () => {
    expect(parseLoginSearchParams({ error: ["A", "B"], register: ["Y", "N"], submitted: ["Y", "N"] })).toEqual({
      errorMessage: "A",
      hasSubmitted: true,
      isLogin: false,
    });
    expect(parseLoginSearchParams({ register: ["N", "Y"], submitted: ["N", "Y"] })).toMatchObject({
      hasSubmitted: false,
      isLogin: true,
    });
  });

  it("flags submitted only when submitted is Y", () => {
    expect(parseLoginSearchParams({ submitted: "Y" }).hasSubmitted).toBe(true);
    expect(parseLoginSearchParams({ submitted: "y" }).hasSubmitted).toBe(false);
  });
});
