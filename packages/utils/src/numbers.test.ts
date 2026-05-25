import { describe, expect, it, vi } from "vitest";

import { addOrdinal, get2DigitNumber, getRandomInteger } from "./numbers";

describe("addOrdinal", () => {
  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [5, "5th"],
    [10, "10th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [14, "14th"],
    [21, "21st"],
    [22, "22nd"],
    [23, "23rd"],
    [31, "31st"],
    [32, "32nd"],
    [100, "100th"],
    [101, "101st"],
    [111, "111th"],
    [112, "112th"],
    [113, "113th"],
  ])("returns %j for %d", (n, expected) => {
    expect(addOrdinal(n)).toBe(expected);
  });

  it("handles 0", () => {
    expect(addOrdinal(0)).toBe("0th");
  });
});

describe("get2DigitNumber", () => {
  it("pads single-digit numbers with a leading zero", () => {
    expect(get2DigitNumber(0)).toBe("00");
    expect(get2DigitNumber(1)).toBe("01");
    expect(get2DigitNumber(9)).toBe("09");
  });

  it("returns two-digit numbers unchanged", () => {
    expect(get2DigitNumber(10)).toBe("10");
    expect(get2DigitNumber(59)).toBe("59");
    expect(get2DigitNumber(99)).toBe("99");
  });

  it("does not truncate numbers with more than two digits", () => {
    expect(get2DigitNumber(100)).toBe("100");
    expect(get2DigitNumber(1000)).toBe("1000");
  });
});

describe("getRandomInteger", () => {
  it("returns a value within [from, to)", () => {
    for (let i = 0; i < 50; i++) {
      const result = getRandomInteger(5, 10);
      expect(result).toBeGreaterThanOrEqual(5);
      expect(result).toBeLessThan(10);
    }
  });

  it("uses defaults of from=0, to=10 when no args are provided", () => {
    for (let i = 0; i < 50; i++) {
      const result = getRandomInteger();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    }
  });

  it("returns 0 when to <= from", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(getRandomInteger(5, 5)).toBe(0);
    expect(getRandomInteger(10, 5)).toBe(0);
    consoleSpy.mockRestore();
  });

  it("returns from when range is 1", () => {
    for (let i = 0; i < 20; i++) {
      expect(getRandomInteger(7, 8)).toBe(7);
    }
  });

  it("always returns an integer", () => {
    for (let i = 0; i < 50; i++) {
      const result = getRandomInteger(0, 100);
      expect(Number.isInteger(result)).toBe(true);
    }
  });
});
