import { describe, expect, it } from "vitest";

import { renamePasskeySchema } from "./schemas";

describe("renamePasskeySchema", () => {
  it("trims the name", () => {
    expect(renamePasskeySchema({ name: "  Work laptop  ", passkeyId: 1 })).toEqual({
      name: "Work laptop",
      passkeyId: 1,
    });
  });

  it("rejects blank and overlong names", () => {
    expect(renamePasskeySchema({ name: "   ", passkeyId: 1 }).toString()).toContain("must be");
    expect(renamePasskeySchema({ name: "a".repeat(101), passkeyId: 1 }).toString()).toContain("must be");
  });

  it("rejects a non-positive passkey id", () => {
    expect(renamePasskeySchema({ name: "ok", passkeyId: 0 }).toString()).toContain("must be");
  });
});
