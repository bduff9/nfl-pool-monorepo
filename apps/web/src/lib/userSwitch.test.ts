import { beforeEach, describe, expect, it, vi } from "vitest";

const loadIsUserSwitch = async () => (await import("./userSwitch")).isUserSwitch;

describe("isUserSwitch", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("is false for the first user seen after a page load", async () => {
    const isUserSwitch = await loadIsUserSwitch();

    expect(isUserSwitch(1)).toBe(false);
  });

  it("is false when the same user signs back in", async () => {
    const isUserSwitch = await loadIsUserSwitch();

    isUserSwitch(1);

    expect(isUserSwitch(1)).toBe(false);
  });

  it("is true when a different user signs in", async () => {
    const isUserSwitch = await loadIsUserSwitch();

    isUserSwitch(1);

    expect(isUserSwitch(2)).toBe(true);
  });

  it("is false again once the switch has been recorded", async () => {
    const isUserSwitch = await loadIsUserSwitch();

    isUserSwitch(1);
    isUserSwitch(2);

    expect(isUserSwitch(2)).toBe(false);
  });
});
