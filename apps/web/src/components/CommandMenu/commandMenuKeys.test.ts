import { describe, expect, it } from "vitest";

import { isCommandKShortcut, isTypingElement } from "./commandMenuKeys";

describe("isTypingElement", () => {
  it("matches form fields and contenteditable", () => {
    expect(isTypingElement("INPUT", false)).toBe(true);
    expect(isTypingElement("TEXTAREA", false)).toBe(true);
    expect(isTypingElement("SELECT", false)).toBe(true);
    expect(isTypingElement("DIV", true)).toBe(true);
  });

  it("ignores other elements", () => {
    expect(isTypingElement("DIV", false)).toBe(false);
    expect(isTypingElement("BUTTON", false)).toBe(false);
  });
});

describe("isCommandKShortcut", () => {
  it("needs k with meta or ctrl", () => {
    expect(isCommandKShortcut("k", true, false)).toBe(true);
    expect(isCommandKShortcut("K", false, true)).toBe(true);
    expect(isCommandKShortcut("k", false, false)).toBe(false);
    expect(isCommandKShortcut("j", true, false)).toBe(false);
  });
});
