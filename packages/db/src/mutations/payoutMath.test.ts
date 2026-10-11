import { describe, expect, it } from "vitest";

import { getPrizeAmounts } from "./payoutMath";

const winnersAt = (...ranks: Array<number>) => ranks.map((Rank, index) => ({ Rank, UserID: index }));

describe("getPrizeAmounts", () => {
  it("leaves prizes untouched when each place has exactly one winner", () => {
    expect(getPrizeAmounts(winnersAt(1, 2), [0, 20, 8])).toEqual([0, 20, 8]);
  });

  it("splits a tied place evenly and rounds to cents", () => {
    expect(getPrizeAmounts(winnersAt(1, 1, 1), [0, 10, 0])).toEqual([0, 3.33, 0]);
    expect(getPrizeAmounts(winnersAt(2, 2, 2), [0, 0, 5])).toEqual([0, 0, 1.67]);
  });

  it("rolls an empty place into the previous place and zeroes it", () => {
    expect(getPrizeAmounts(winnersAt(1), [0, 20, 8])).toEqual([0, 28, 0]);
  });

  it("cascades several empty places upward", () => {
    expect(getPrizeAmounts(winnersAt(1, 1), [0, 20, 8, 4])).toEqual([0, 16, 0, 0]);
  });

  it("rolls the first empty place into index 0, which is never paid", () => {
    expect(getPrizeAmounts([], [1, 20, 8])).toEqual([29, 0, 0]);
  });

  it("does not mutate the input prizes", () => {
    const prizes: [number, number, number] = [0, 20, 8];

    getPrizeAmounts(winnersAt(1), prizes);

    expect(prizes).toEqual([0, 20, 8]);
  });
});
