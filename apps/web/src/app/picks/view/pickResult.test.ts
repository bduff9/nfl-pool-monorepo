import { describe, expect, it } from "vitest";

import { getPickResultClasses } from "./pickResult";

describe("getPickResultClasses", () => {
  it("has no classes while the game has no winner", () => {
    expect(getPickResultClasses(null, 5)).toEqual({ points: "", row: "" });
    expect(getPickResultClasses(undefined, null)).toEqual({ points: "", row: "" });
    expect(getPickResultClasses(0, 0)).toEqual({ points: "", row: "" });
  });

  it("marks a pick on the winner", () => {
    expect(getPickResultClasses(7, 7)).toEqual({ points: "text-emerald-900", row: "bg-green-200" });
  });

  it("marks a pick on the loser, including no pick at all", () => {
    expect(getPickResultClasses(7, 8)).toEqual({ points: "text-red-900 line-through", row: "bg-red-300" });
    expect(getPickResultClasses(7, null)).toEqual({ points: "text-red-900 line-through", row: "bg-red-300" });
  });
});
