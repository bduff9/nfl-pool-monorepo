import { describe, expect, it } from "vitest";

import { getRowActionVisibility } from "./rowActionVisibility";

describe("getRowActionVisibility", () => {
  it("shows payment when the user owes money", () => {
    expect(getRowActionVisibility({ UserDoneRegistering: 0, UserOwes: 5, UserTrusted: 0 }).canTakePayment).toBe(true);
  });

  it("shows payment for a finished registration even when nothing is owed", () => {
    expect(getRowActionVisibility({ UserDoneRegistering: 1, UserOwes: null, UserTrusted: 1 }).canTakePayment).toBe(
      true,
    );
  });

  it("hides payment when nothing is owed and registration is unfinished", () => {
    expect(getRowActionVisibility({ UserDoneRegistering: 0, UserOwes: 0, UserTrusted: 0 }).canTakePayment).toBe(false);
    expect(getRowActionVisibility({ UserDoneRegistering: 0, UserOwes: null, UserTrusted: 0 }).canTakePayment).toBe(
      false,
    );
  });

  it("offers trust and delete only for untrusted users", () => {
    expect(getRowActionVisibility({ UserDoneRegistering: 0, UserOwes: 0, UserTrusted: 0 }).canTrust).toBe(true);
    expect(getRowActionVisibility({ UserDoneRegistering: 0, UserOwes: 0, UserTrusted: 1 }).canTrust).toBe(false);
  });

  it("offers the survivor toggle only after registration is done", () => {
    expect(getRowActionVisibility({ UserDoneRegistering: 1, UserOwes: 0, UserTrusted: 0 }).canManageSurvivor).toBe(
      true,
    );
    expect(getRowActionVisibility({ UserDoneRegistering: 0, UserOwes: 0, UserTrusted: 0 }).canManageSurvivor).toBe(
      false,
    );
  });
});
