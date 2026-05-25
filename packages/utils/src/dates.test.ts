import { afterEach, describe, expect, it, vi } from "vitest";

import { formatDueDate, getCurrentSeasonYear, getHoursBetweenDates } from "./dates";

describe("formatDueDate", () => {
  it("formats a date with full day-of-week, month, day, and year", () => {
    const date = new Date("2025-09-07T12:00:00Z");
    const result = formatDueDate(date);
    expect(result).toContain("Sunday");
    expect(result).toContain("September");
    expect(result).toContain("7");
    expect(result).toContain("2025");
  });
});

describe("getCurrentSeasonYear", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the current year when month is April or later", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-09-01T12:00:00Z"));
    expect(getCurrentSeasonYear()).toBe(2025);
  });

  it("returns the previous year in January (before April)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    expect(getCurrentSeasonYear()).toBe(2025);
  });

  it("returns the previous year in February", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-10T12:00:00Z"));
    expect(getCurrentSeasonYear()).toBe(2025);
  });

  it("returns the previous year in March", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-20T12:00:00Z"));
    expect(getCurrentSeasonYear()).toBe(2025);
  });

  it("returns the current year in April (month index 3)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-04-01T12:00:00Z"));
    expect(getCurrentSeasonYear()).toBe(2025);
  });
});

describe("getHoursBetweenDates", () => {
  it("returns 0 when dates are less than 1 hour apart", () => {
    const date1 = new Date("2025-01-01T12:00:00Z");
    const date2 = new Date("2025-01-01T12:30:00Z");
    expect(getHoursBetweenDates(date1, date2)).toBe(0);
  });

  it("returns exact hours when dates are evenly spaced", () => {
    const date1 = new Date("2025-01-01T00:00:00Z");
    const date2 = new Date("2025-01-01T05:00:00Z");
    expect(getHoursBetweenDates(date1, date2)).toBe(5);
  });

  it("truncates partial hours", () => {
    const date1 = new Date("2025-01-01T00:00:00Z");
    const date2 = new Date("2025-01-01T02:59:59Z");
    expect(getHoursBetweenDates(date1, date2)).toBe(2);
  });

  it("handles multi-day spans", () => {
    const date1 = new Date("2025-01-01T00:00:00Z");
    const date2 = new Date("2025-01-03T12:00:00Z");
    expect(getHoursBetweenDates(date1, date2)).toBe(60);
  });

  it("returns negative hours when date2 is before date1", () => {
    const date1 = new Date("2025-01-01T10:00:00Z");
    const date2 = new Date("2025-01-01T05:00:00Z");
    expect(getHoursBetweenDates(date1, date2)).toBe(-5);
  });
});
