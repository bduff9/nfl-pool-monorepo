import { describe, expect, it } from "vitest";

import { formatSpread } from "./formatSpread";

describe("formatSpread", () => {
  it("returns null without a usable spread", () => {
    expect(formatSpread(null)).toBeNull();
    expect(formatSpread(undefined)).toBeNull();
    expect(formatSpread("")).toBeNull();
    expect(formatSpread("abc")).toBeNull();
    expect(formatSpread(Number.NaN)).toBeNull();
  });

  it("prefixes positive spreads with a plus", () => {
    expect(formatSpread(3.5)).toBe("+3.5");
    expect(formatSpread("7")).toBe("+7");
  });

  it("keeps the sign of negative and zero spreads", () => {
    expect(formatSpread(-3.5)).toBe("-3.5");
    expect(formatSpread("-1")).toBe("-1");
    expect(formatSpread(0)).toBe("0");
    expect(formatSpread("0")).toBe("0");
  });
});
