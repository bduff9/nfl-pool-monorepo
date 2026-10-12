import { describe, expect, it } from "vitest";

import { getWakeLockAction } from "./wakeLockPolicy";

const base = { isHeld: false, isLive: true, isSupported: true, isVisible: true };

describe("getWakeLockAction", () => {
  it("acquires when live and visible", () => {
    expect(getWakeLockAction(base)).toBe("acquire");
  });

  it("does nothing when already held while live and visible", () => {
    expect(getWakeLockAction({ ...base, isHeld: true })).toBe("none");
  });

  it("releases when no game is live", () => {
    expect(getWakeLockAction({ ...base, isHeld: true, isLive: false })).toBe("release");
    expect(getWakeLockAction({ ...base, isLive: false })).toBe("none");
  });

  it("releases a held lock when hidden and never acquires while hidden", () => {
    expect(getWakeLockAction({ ...base, isHeld: true, isVisible: false })).toBe("release");
    expect(getWakeLockAction({ ...base, isVisible: false })).toBe("none");
  });

  it("does nothing when unsupported", () => {
    expect(getWakeLockAction({ ...base, isSupported: false })).toBe("none");
  });
});
