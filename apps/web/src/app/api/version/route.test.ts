import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/version", () => {
  it("returns the build version and is never cached", async () => {
    const response = GET();

    expect(await response.json()).toEqual({ version: expect.any(String) });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
