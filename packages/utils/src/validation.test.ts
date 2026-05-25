import { type } from "arktype";
import { describe, expect, it } from "vitest";

import { weekSchema } from "./validation";

describe("weekSchema", () => {
  it("accepts valid week numbers", () => {
    expect(weekSchema(1)).toBe(1);
    expect(weekSchema(18)).toBe(18);
  });

  it("rejects out-of-range weeks", () => {
    expect(weekSchema(0) instanceof type.errors).toBe(true);
    expect(weekSchema(19) instanceof type.errors).toBe(true);
  });
});
