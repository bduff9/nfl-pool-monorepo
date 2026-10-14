import { describe, expect, it } from "vitest";

import { getGlidingRows } from "./rowMove";

const allInView = () => true;

describe("getGlidingRows", () => {
  it("glides only the rows whose place changes", () => {
    expect(getGlidingRows([1, 2, 3, 4], [3, 1, 2, 4], allInView)).toEqual(new Set([3, 1, 2]));
  });

  it("glides nothing when the order is unchanged", () => {
    expect(getGlidingRows([1, 2, 3], [1, 2, 3], allInView).size).toBe(0);
  });

  it("leaves out a row moving from or to a place out of view", () => {
    const firstThreeInView = (index: number) => index < 3;

    expect(getGlidingRows([1, 2, 3, 4, 5], [5, 2, 1, 3, 4], firstThreeInView)).toEqual(new Set([1]));
  });

  it("leaves out a row that was not in the old order", () => {
    expect(getGlidingRows([1, 2], [3, 2, 1], allInView)).toEqual(new Set([1]));
  });
});
