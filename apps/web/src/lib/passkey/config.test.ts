import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEnv = vi.hoisted(() => ({ NEXT_PUBLIC_SITE_URL: "https://pool.example.com/some/path" }));

vi.mock("@/lib/env", () => ({ env: mockEnv }));

import { getPasskeyConfig } from "./config";

describe("getPasskeyConfig", () => {
  beforeEach(() => {
    mockEnv.NEXT_PUBLIC_SITE_URL = "https://pool.example.com/some/path";
  });

  it("uses the site hostname as the rpID and its origin as the expected origin", () => {
    expect(getPasskeyConfig()).toEqual({
      origin: "https://pool.example.com",
      rpID: "pool.example.com",
      rpName: "NFL Confidence Pool",
    });
  });

  it("keeps the port in the origin but not in the rpID for local development", () => {
    mockEnv.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

    expect(getPasskeyConfig()).toEqual({
      origin: "http://localhost:3000",
      rpID: "localhost",
      rpName: "NFL Confidence Pool",
    });
  });
});
