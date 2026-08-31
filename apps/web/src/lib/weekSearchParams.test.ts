import { describe, expect, it } from "vitest";

import { appendWeekIfMissing, parseWeekParam, withWeek } from "./weekSearchParams";

describe("parseWeekParam", () => {
  it("parses a valid week number", () => {
    expect(parseWeekParam("5")).toBe(5);
    expect(parseWeekParam(12)).toBe(12);
  });

  it("parses the first value when given an array", () => {
    expect(parseWeekParam(["3", "4"])).toBe(3);
  });

  it("returns null for missing or empty values", () => {
    expect(parseWeekParam(null)).toBeNull();
    expect(parseWeekParam(undefined)).toBeNull();
    expect(parseWeekParam("")).toBeNull();
  });

  it("returns null for out-of-range or non-integer weeks", () => {
    expect(parseWeekParam("0")).toBeNull();
    expect(parseWeekParam("19")).toBeNull();
    expect(parseWeekParam("-1")).toBeNull();
    expect(parseWeekParam("3.5")).toBeNull();
    expect(parseWeekParam("abc")).toBeNull();
  });

  it("accepts week 1 and week 18", () => {
    expect(parseWeekParam("1")).toBe(1);
    expect(parseWeekParam("18")).toBe(18);
  });
});

describe("withWeek", () => {
  it("appends the week query to a path", () => {
    expect(withWeek("/", 4)).toBe("/?week=4");
    expect(withWeek("/picks/set", 7)).toBe("/picks/set?week=7");
  });

  it("replaces an existing week query", () => {
    expect(withWeek("/weekly?week=2", 9)).toBe("/weekly?week=9");
  });

  it("preserves other query params", () => {
    expect(withWeek("/admin/users?page=2", 5)).toBe("/admin/users?page=2&week=5");
  });

  it("returns the original href when week is missing", () => {
    expect(withWeek("/support", null)).toBe("/support");
    expect(withWeek("/support", undefined)).toBe("/support");
    expect(withWeek("/support", 0)).toBe("/support");
  });

  it("keeps the hash after the query string", () => {
    expect(withWeek("/support#faq", 3)).toBe("/support?week=3#faq");
    expect(withWeek("/support?tab=contact#faq", 3)).toBe("/support?tab=contact&week=3#faq");
  });
});

describe("appendWeekIfMissing", () => {
  it("adds week when the href has no week param", () => {
    expect(appendWeekIfMissing("/picks/set", 4)).toBe("/picks/set?week=4");
  });

  it("leaves an explicit week param alone", () => {
    expect(appendWeekIfMissing("/weekly?week=9", 2)).toBe("/weekly?week=9");
  });

  it("returns the original href when week is missing", () => {
    expect(appendWeekIfMissing("/picks/set", null)).toBe("/picks/set");
    expect(appendWeekIfMissing("/picks/set", undefined)).toBe("/picks/set");
  });

  it("keeps the hash after the query string", () => {
    expect(appendWeekIfMissing("/support#faq", 3)).toBe("/support?week=3#faq");
  });
});
