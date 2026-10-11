import { describe, expect, it } from "vitest";

import { getProfileInputClassName, getProfileLabelClassName } from "./profileTextFieldClasses";

describe("getProfileLabelClassName", () => {
  it("marks required fields", () => {
    expect(getProfileLabelClassName(true)).toBe("h-5 required");
  });

  it("leaves optional fields unmarked", () => {
    expect(getProfileLabelClassName(false)).toBe("h-5");
  });
});

describe("getProfileInputClassName", () => {
  it("strips the border on read-only inputs even with an error", () => {
    expect(getProfileInputClassName(true, true)).toBe("border-0 shadow-none");
    expect(getProfileInputClassName(true, false)).toBe("border-0 shadow-none");
  });

  it("highlights editable inputs that have an error", () => {
    expect(getProfileInputClassName(false, true)).toBe("border-red-600");
  });

  it("adds no classes to valid editable inputs", () => {
    expect(getProfileInputClassName(false, false)).toBe("");
  });
});
