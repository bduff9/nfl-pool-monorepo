import { afterEach, describe, expect, it, vi } from "vitest";

import { hapticTap } from "./haptics";

describe("hapticTap", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
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

  it("toggles a hidden switch label where vibration is unsupported, creating it only once", async () => {
    const input = { setAttribute: vi.fn(), tabIndex: 0, type: "" };
    const label = { append: vi.fn(), click: vi.fn(), style: {} };
    const createElement = vi.fn((tagName: string) => (tagName === "label" ? label : input));
    const appendToBody = vi.fn();

    vi.stubGlobal("navigator", {});
    vi.stubGlobal("document", { body: { append: appendToBody }, createElement });

    const { hapticTap: hapticTapFresh } = await import("./haptics");

    hapticTapFresh();
    hapticTapFresh();

    expect(createElement).toHaveBeenCalledTimes(2);
    expect(appendToBody).toHaveBeenCalledTimes(1);
    expect(label.click).toHaveBeenCalledTimes(2);
  });
});
