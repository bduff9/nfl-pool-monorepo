import { describe, expect, it } from "vitest";

import { weekSchema } from "./zod";

describe("weekSchema", () => {
  it("accepts valid week numbers", () => {
    expect(weekSchema.parse(1)).toBe(1);
    expect(weekSchema.parse(18)).toBe(18);
  });

  it("rejects out-of-range weeks", () => {
    expect(weekSchema.safeParse(0).success).toBe(false);
    expect(weekSchema.safeParse(19).success).toBe(false);
  });
});
