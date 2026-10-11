import { describe, expect, it } from "vitest";

import { isNewVersionAvailable } from "./appVersion";

describe("isNewVersionAvailable", () => {
  it("is true when the server reports a different version than the one running", () => {
    expect(isNewVersionAvailable("abc123", "def456")).toBe(true);
  });

  it("is false when the versions match", () => {
    expect(isNewVersionAvailable("abc123", "abc123")).toBe(false);
  });

  it("is false when this build has no version, as in dev and local builds", () => {
    expect(isNewVersionAvailable("", "def456")).toBe(false);
  });

  it("is false when the server response is missing or malformed", () => {
    expect(isNewVersionAvailable("abc123", undefined)).toBe(false);
    expect(isNewVersionAvailable("abc123", "")).toBe(false);
    expect(isNewVersionAvailable("abc123", 42)).toBe(false);
  });
});
