import { describe, expect, it } from "vitest";

import { canShowDeregister, getRowActionVisibility } from "./rowActionVisibility";

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

describe("canShowDeregister", () => {
  const registered = { UserDoneRegistering: 1, UserID: 2, UserPaid: null };

  it("shows for a registered user with no payment", () => {
    expect(canShowDeregister(registered, 1)).toBe(true);
    expect(canShowDeregister({ ...registered, UserPaid: 0 }, 1)).toBe(true);
  });

  it("hides for unregistered users, the acting admin, and users with a payment on record", () => {
    expect(canShowDeregister({ ...registered, UserDoneRegistering: 0 }, 1)).toBe(false);
    expect(canShowDeregister(registered, 2)).toBe(false);
    expect(canShowDeregister({ ...registered, UserPaid: 20 }, 1)).toBe(false);
  });
});
