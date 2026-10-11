import { describe, expect, it } from "vitest";

import { getHashId } from "./hashId";

describe("getHashId", () => {
  it("strips a leading hash", () => {
    expect(getHashId("#rules")).toBe("rules");
  });

  it("returns the value unchanged without a leading hash", () => {
    expect(getHashId("rules")).toBe("rules");
    expect(getHashId("")).toBe("");
  });
});
