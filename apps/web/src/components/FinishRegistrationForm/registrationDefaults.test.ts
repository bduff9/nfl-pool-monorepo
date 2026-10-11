import { describe, expect, it } from "vitest";

import { getRegistrationDefaults, shouldShowUntrustedNotice } from "./registrationDefaults";

type User = Parameters<typeof getRegistrationDefaults>[0];

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    UserEmail: "a@b.com",
    UserFirstName: null,
    UserLastName: null,
    UserName: null,
    UserPaymentAccount: null,
    UserPaymentType: null,
    UserPlaysSurvivor: 0,
    UserReferredByRaw: null,
    UserTeamName: null,
    UserTrusted: 0,
    ...overrides,
  }) as User;

describe("getRegistrationDefaults", () => {
  it("falls back to empty strings and Paypal for a brand new user", () => {
    expect(getRegistrationDefaults(makeUser(), "Not Started")).toEqual({
      UserEmail: "a@b.com",
      UserFirstName: "",
      UserLastName: "",
      UserName: "",
      UserPaymentAccount: "",
      UserPaymentType: "Paypal",
      UserPlaysSurvivor: false,
      UserReferredByRaw: "",
      UserTeamName: "",
    });
  });

  it("derives names from the stored user", () => {
    const values = getRegistrationDefaults(makeUser({ UserName: "Jane Doe" }), "Not Started");

    expect(values).toMatchObject({ UserFirstName: "Jane", UserLastName: "Doe", UserName: "Jane Doe" });
  });

  it("keeps stored payment, referral and team values", () => {
    const values = getRegistrationDefaults(
      makeUser({
        UserPaymentAccount: "jane@pay.com",
        UserPaymentType: "Venmo",
        UserReferredByRaw: "Bob",
        UserTeamName: "Team",
      }),
      "Not Started",
    );

    expect(values).toMatchObject({
      UserPaymentAccount: "jane@pay.com",
      UserPaymentType: "Venmo",
      UserReferredByRaw: "Bob",
      UserTeamName: "Team",
    });
  });

  it("only preselects survivor before the season starts", () => {
    const user = makeUser({ UserPlaysSurvivor: 1 });

    expect(getRegistrationDefaults(user, "Not Started").UserPlaysSurvivor).toBe(true);
    expect(getRegistrationDefaults(user, "In Progress").UserPlaysSurvivor).toBe(false);
    expect(getRegistrationDefaults(makeUser(), "Not Started").UserPlaysSurvivor).toBe(false);
  });
});

describe("shouldShowUntrustedNotice", () => {
  it("shows for untrusted users who already gave a referral", () => {
    expect(shouldShowUntrustedNotice(makeUser({ UserReferredByRaw: "Bob" }))).toBe(true);
  });

  it("does not show for trusted users or users without a referral", () => {
    expect(shouldShowUntrustedNotice(makeUser({ UserReferredByRaw: "Bob", UserTrusted: 1 }))).toBe(false);
    expect(shouldShowUntrustedNotice(makeUser())).toBe(false);
  });
});
