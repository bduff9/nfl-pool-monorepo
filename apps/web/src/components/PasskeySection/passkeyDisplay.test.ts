import { describe, expect, it } from "vitest";

import { describePasskeyUsage } from "./passkeyDisplay";

describe("passkeyDisplay", () => {
  it("formats dates in UTC", () => {
    expect(describePasskeyUsage(new Date("2026-10-11T23:30:00Z"), null)).toBe("Added Oct 11, 2026 · Never used");
  });

  it("describes added and last used dates", () => {
    const added = new Date("2026-09-01T12:00:00Z");

    expect(describePasskeyUsage(added, new Date("2026-10-11T12:00:00Z"))).toBe(
      "Added Sep 1, 2026 · Last used Oct 11, 2026",
    );
    expect(describePasskeyUsage(added, null)).toBe("Added Sep 1, 2026 · Never used");
  });
});
