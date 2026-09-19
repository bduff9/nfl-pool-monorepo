import { describe, expect, it } from "vitest";

import { isThemeToggleHotkey } from "./useThemeHotkey";

const baseEvent = { altKey: false, ctrlKey: false, key: "d", metaKey: false, shiftKey: false };

describe("isThemeToggleHotkey", () => {
  it("matches a plain 'd' key press", () => {
    expect(isThemeToggleHotkey({ ...baseEvent })).toBe(true);
  });

  it("matches an uppercase 'D' key press", () => {
    expect(isThemeToggleHotkey({ ...baseEvent, key: "D" })).toBe(true);
  });

  it("does not match a plain 'd' combined with an unrelated modifier", () => {
    expect(isThemeToggleHotkey({ ...baseEvent, altKey: true })).toBe(false);
  });

  it("matches cmd/ctrl+shift+d", () => {
    expect(isThemeToggleHotkey({ ...baseEvent, ctrlKey: true, shiftKey: true })).toBe(true);
    expect(isThemeToggleHotkey({ ...baseEvent, metaKey: true, shiftKey: true })).toBe(true);
  });

  it("matches shift+d without cmd/ctrl, since shift alone doesn't disqualify the plain-'d' match", () => {
    expect(isThemeToggleHotkey({ ...baseEvent, shiftKey: true })).toBe(true);
  });

  it("does not match cmd/ctrl+d without shift", () => {
    expect(isThemeToggleHotkey({ ...baseEvent, ctrlKey: true })).toBe(false);
    expect(isThemeToggleHotkey({ ...baseEvent, metaKey: true })).toBe(false);
  });

  it("does not match a different key", () => {
    expect(isThemeToggleHotkey({ ...baseEvent, key: "a" })).toBe(false);
  });
});
