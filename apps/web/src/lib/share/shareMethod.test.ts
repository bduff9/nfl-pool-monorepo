import { describe, expect, it } from "vitest";

import {
  buildClipboardText,
  chooseShareMethod,
  getShareFileName,
  isAbortError,
  isNotAllowedError,
} from "./shareMethod";

describe("chooseShareMethod", () => {
  it("shares files when an image exists and files are supported", () => {
    expect(chooseShareMethod({ canShare: true, canShareFiles: true, fileReady: true })).toBe("files");
  });

  it("shares a link while the image is not ready yet", () => {
    expect(chooseShareMethod({ canShare: true, canShareFiles: false, fileReady: false })).toBe("link");
  });

  it("falls back to a link when files are unsupported", () => {
    expect(chooseShareMethod({ canShare: true, canShareFiles: false, fileReady: true })).toBe("link");
    expect(chooseShareMethod({ canShare: true, canShareFiles: true, fileReady: false })).toBe("link");
  });

  it("falls back to the clipboard without the share API", () => {
    expect(chooseShareMethod({ canShare: false, canShareFiles: false, fileReady: true })).toBe("clipboard");
  });
});

describe("getShareFileName", () => {
  it("derives the name from the image url", () => {
    expect(getShareFileName("/api/share/week/6")).toBe("week-6.png");
    expect(getShareFileName("/somewhere/else")).toBe("share.png");
  });
});

describe("isAbortError", () => {
  it("detects user cancellation", () => {
    expect(isAbortError(new DOMException("cancelled", "AbortError"))).toBe(true);
    expect(isAbortError(new Error("nope"))).toBe(false);
  });
});

describe("isNotAllowedError", () => {
  it("detects a lost user activation", () => {
    expect(isNotAllowedError(new DOMException("denied", "NotAllowedError"))).toBe(true);
    expect(isNotAllowedError(new DOMException("cancelled", "AbortError"))).toBe(false);
  });
});

describe("buildClipboardText", () => {
  it("joins text and url", () => {
    expect(buildClipboardText("hi", "https://x.test")).toBe("hi https://x.test");
    expect(buildClipboardText("hi")).toBe("hi");
  });
});
