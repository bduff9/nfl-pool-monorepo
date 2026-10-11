import { afterEach, describe, expect, it, vi } from "vitest";

import { hapticTap } from "./haptics";

describe("hapticTap", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("vibrates briefly where the browser supports it", () => {
    const vibrate = vi.fn();

    vi.stubGlobal("navigator", { vibrate });
    hapticTap();

    expect(vibrate).toHaveBeenCalledWith(10);
  });

  it("does nothing where vibration is unsupported", () => {
    vi.stubGlobal("navigator", {});

    expect(() => hapticTap()).not.toThrow();
  });
});
