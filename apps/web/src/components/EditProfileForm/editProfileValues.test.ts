import { describe, expect, it } from "vitest";

import type { getCurrentUser } from "@/server/loaders/user";

import { buildDefaultValues, hasValidPhone, smsOffUnlessPhone } from "./editProfileValues";

type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

describe("buildDefaultValues", () => {
  const build = (phone: string | null) =>
    buildDefaultValues({ UserPaymentType: null, UserPhone: phone, UserTeamName: null } as CurrentUser, []);

  it("blanks missing values and defaults the payment type", () => {
    expect(build(null)).toMatchObject({ UserPaymentType: "Paypal", UserPhone: "", UserTeamName: "" });
  });

  it("keeps a +1 prefix and adds it otherwise", () => {
    expect(build("+15551234567").UserPhone).toBe("+15551234567");
    expect(build("5551234567").UserPhone).toBe("+15551234567");
  });
});

describe("hasValidPhone", () => {
  it("needs 10 characters and no field error", () => {
    expect(hasValidPhone("5551234567", undefined)).toBe(true);
    expect(hasValidPhone("555123456", undefined)).toBe(false);
    expect(hasValidPhone("5551234567", "Invalid phone")).toBe(false);
  });
});

describe("smsOffUnlessPhone", () => {
  const notifications = [{ NotificationSMS: 1, NotificationSMSHoursBefore: 3 }];

  it("keeps notifications when the phone is valid", () => {
    expect(smsOffUnlessPhone(true, notifications)).toBe(notifications);
  });

  it("turns SMS off and clears hours when the phone is not valid", () => {
    expect(smsOffUnlessPhone(false, notifications)).toEqual([{ NotificationSMS: 0, NotificationSMSHoursBefore: null }]);
  });
});
