import { describe, expect, it } from "vitest";

import { isEmailOn, isPushOn, isSmsOn, shouldShowHoursBefore } from "./notificationChannels";

describe("channel flags", () => {
  it("treats only 1 as on", () => {
    expect(isEmailOn({ NotificationEmail: 1 })).toBe(true);
    expect(isEmailOn({ NotificationEmail: 0 })).toBe(false);
    expect(isEmailOn(undefined)).toBe(false);
    expect(isSmsOn({ NotificationSMS: 1 })).toBe(true);
    expect(isSmsOn({})).toBe(false);
  });

  it("requires a push subscription for push", () => {
    expect(isPushOn({ NotificationPushNotification: 1 }, true)).toBe(true);
    expect(isPushOn({ NotificationPushNotification: 1 }, false)).toBe(false);
    expect(isPushOn(undefined, true)).toBe(false);
  });
});

describe("shouldShowHoursBefore", () => {
  const withHours = { NotificationTypeHasHours: 1 };

  it("is false when the type has no hours", () => {
    expect(shouldShowHoursBefore({ NotificationTypeHasHours: 0 }, { NotificationEmail: 1 }, true)).toBe(false);
  });

  it("is false when no channel is on", () => {
    expect(shouldShowHoursBefore(withHours, undefined, true)).toBe(false);
    expect(shouldShowHoursBefore(withHours, { NotificationPushNotification: 1 }, false)).toBe(false);
  });

  it("is true when any channel is on", () => {
    expect(shouldShowHoursBefore(withHours, { NotificationEmail: 1 }, false)).toBe(true);
    expect(shouldShowHoursBefore(withHours, { NotificationSMS: 1 }, false)).toBe(true);
    expect(shouldShowHoursBefore(withHours, { NotificationPushNotification: 1 }, true)).toBe(true);
  });
});
