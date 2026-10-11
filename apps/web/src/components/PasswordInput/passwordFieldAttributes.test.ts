import { describe, expect, it } from "vitest";

import { getPasswordFieldAttributes } from "./passwordFieldAttributes";

describe("getPasswordFieldAttributes", () => {
  it("uses current-password for login and new-password otherwise", () => {
    expect(getPasswordFieldAttributes(true, false).autoComplete).toBe("current-password");
    expect(getPasswordFieldAttributes(false, false).autoComplete).toBe("new-password");
  });

  it("hides the password by default", () => {
    expect(getPasswordFieldAttributes(true, false)).toMatchObject({
      inputType: "password",
      toggleLabel: "Show password",
    });
  });

  it("reveals the password when visible", () => {
    expect(getPasswordFieldAttributes(true, true)).toMatchObject({ inputType: "text", toggleLabel: "Hide password" });
  });
});
