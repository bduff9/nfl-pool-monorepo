import { cn } from "@nfl-pool-monorepo/utils/styles";
import { describe, expect, it } from "vitest";

describe("utils/styles", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });
});
