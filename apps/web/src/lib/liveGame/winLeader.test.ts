import { describe, expect, it } from "vitest";

import { getWinLeader } from "./winLeader";

describe("getWinLeader", () => {
  it("names the home team when it is ahead", () => {
    expect(getWinLeader(64, "LAR", "BUF")).toEqual({ name: "LAR", pct: 64 });
  });

  it("names the visitor with its own share when the home team is behind", () => {
    expect(getWinLeader(36, "LAR", "BUF")).toEqual({ name: "BUF", pct: 64 });
  });

  it("treats an even game as the home team's", () => {
    expect(getWinLeader(50, "LAR", "BUF")).toEqual({ name: "LAR", pct: 50 });
  });
});
