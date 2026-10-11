import { describe, expect, it } from "vitest";

import { weekFromCookie } from "./weekCookie";

describe("weekFromCookie", () => {
  it("parses a numeric cookie", () => {
    expect(weekFromCookie("7")).toBe(7);
  });

  it("returns 0 for missing, empty or non-numeric values", () => {
    expect(weekFromCookie(undefined)).toBe(0);
    expect(weekFromCookie("")).toBe(0);
    expect(weekFromCookie("abc")).toBe(0);
  });
});
