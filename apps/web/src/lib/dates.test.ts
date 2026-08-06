import { describe, expect, it } from "vitest";

import { formatDateForKickoff, formatTimeFromKickoff, getTimeRemainingString } from "./dates";

describe("formatTimeFromKickoff", () => {
  it("formats in UTC regardless of the runtime's local timezone", () => {
    // 2026-01-04T18:00:00Z is 6:00 PM UTC no matter what timezone this test runs in -
    // if the runtime's local timezone leaked in (the hydration-mismatch bug), this would
    // instead reflect whatever TZ the test process happens to be running under.
    const result = formatTimeFromKickoff(new Date("2026-01-04T18:00:00Z"));
    expect(result).toBe("6:00 PM UTC");
  });
});

describe("formatDateForKickoff", () => {
  it("formats in UTC regardless of the runtime's local timezone", () => {
    // 2026-01-04T23:30:00Z is still Sunday, January 4 in UTC even though it would already
    // be Monday in timezones ahead of UTC - pins the date to avoid a day-boundary mismatch.
    const result = formatDateForKickoff(new Date("2026-01-04T23:30:00Z"));
    expect(result).toBe("Sunday, January 4");
  });
});

describe("getTimeRemainingString", () => {
  it("returns empty string when total is 0 or negative", () => {
    expect(getTimeRemainingString({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })).toBe("");
    expect(getTimeRemainingString({ days: 0, hours: 0, minutes: 0, seconds: 0, total: -1000 })).toBe("");
  });

  it("shows only seconds when under a minute", () => {
    const result = getTimeRemainingString({ days: 0, hours: 0, minutes: 0, seconds: 30, total: 30_000 });
    expect(result).toBe("30 seconds remaining");
  });

  it("uses singular label when value is 1", () => {
    const result = getTimeRemainingString({ days: 0, hours: 0, minutes: 0, seconds: 1, total: 1_000 });
    expect(result).toBe("1 second remaining");
  });

  it("shows minutes and seconds for sub-hour durations", () => {
    const result = getTimeRemainingString({ days: 0, hours: 0, minutes: 5, seconds: 12, total: 312_000 });
    expect(result).toBe("5 minutes, 12 seconds remaining");
  });

  it("shows hours and minutes for sub-day durations", () => {
    const result = getTimeRemainingString({ days: 0, hours: 3, minutes: 45, seconds: 10, total: 13_510_000 });
    expect(result).toBe("3 hours, 45 minutes remaining");
  });

  it("shows singular hour and minute labels", () => {
    const result = getTimeRemainingString({ days: 0, hours: 1, minutes: 1, seconds: 0, total: 3_660_000 });
    expect(result).toBe("1 hour, 1 minute remaining");
  });

  it("shows days and hours for multi-day durations", () => {
    const result = getTimeRemainingString({ days: 2, hours: 5, minutes: 30, seconds: 0, total: 192_600_000 });
    expect(result).toBe("2 days, 5 hours remaining");
  });

  it("limits output to 2 time parts maximum", () => {
    const result = getTimeRemainingString({ days: 1, hours: 2, minutes: 3, seconds: 4, total: 93_784_000 });
    expect(result).toBe("1 day, 2 hours remaining");
    const parts = result.replace(" remaining", "").split(", ");
    expect(parts.length).toBeLessThanOrEqual(2);
  });

  it("shows 0 hours when days are present but hours are 0", () => {
    const result = getTimeRemainingString({ days: 3, hours: 0, minutes: 10, seconds: 5, total: 259_805_000 });
    expect(result).toBe("3 days, 0 hours remaining");
  });
});
