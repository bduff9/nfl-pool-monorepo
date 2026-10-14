import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { config, proxy } from "./proxy";

const ORIGIN = "https://pool.example.com";

const request = (
  path: string,
  { headers = {}, method = "GET" }: { headers?: Record<string, string>; method?: string } = {},
) => new NextRequest(`${ORIGIN}${path}`, { headers, method });

const withSession = (path: string, method = "GET") => request(path, { headers: { cookie: "session=abc123" }, method });

const isPassedThrough = (response: Response): boolean => response.headers.get("x-middleware-next") === "1";

describe("proxy on reads", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(["GET", "HEAD"])("renews the session cookie for a signed-in %s", (method) => {
    const response = proxy(withSession("/weekly", method));
    const cookie = response.cookies.get("session");

    expect(isPassedThrough(response)).toBe(true);
    expect(cookie).toMatchObject({
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: false,
      value: "abc123",
    });
    expect(response.cookies.get("redirect_to")).toBeUndefined();
  });

  it("marks the renewed session cookie secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(proxy(withSession("/weekly")).cookies.get("session")?.secure).toBe(true);
  });

  it("remembers where a signed-out visitor was headed, query included", () => {
    const response = proxy(request("/picks/set?week=6"));

    expect(response.cookies.get("redirect_to")).toMatchObject({
      httpOnly: true,
      maxAge: 60 * 10,
      path: "/",
      sameSite: "lax",
      value: "/picks/set?week=6",
    });
    expect(response.cookies.get("session")).toBeUndefined();
  });

  it.each(["/api/error", "/_next/static/a.js", "/auth/login", "/login", "/logo.png", "/manifest.webmanifest"])(
    "does not remember %s for a signed-out visitor",
    (path) => {
      expect(proxy(request(path)).cookies.get("redirect_to")).toBeUndefined();
    },
  );
});

describe("proxy on changes", () => {
  const post = (headers: Record<string, string>) => request("/api/thing", { headers, method: "POST" });

  it("lets a same-origin POST through", () => {
    const response = proxy(post({ host: "pool.example.com", origin: ORIGIN }));

    expect(isPassedThrough(response)).toBe(true);
    expect(response.status).toBe(200);
  });

  it.each([
    ["no Origin", { host: "pool.example.com" }],
    ["no Host", { origin: ORIGIN }],
    ["a malformed Origin", { host: "pool.example.com", origin: "not a url" }],
    ["a different host", { host: "pool.example.com", origin: "https://evil.example.com" }],
  ])("rejects a POST with %s", (_label, headers) => {
    const response = proxy(post(headers));

    expect(response.status).toBe(403);
    expect(isPassedThrough(response)).toBe(false);
  });

  it.each(["PUT", "PATCH", "DELETE"])("checks the origin on %s too", (method) => {
    expect(
      proxy(request("/x", { headers: { host: "pool.example.com", origin: "https://evil.example.com" }, method }))
        .status,
    ).toBe(403);
  });
});

describe("proxy matcher", () => {
  const runsFor = (url: string, headers: Record<string, string> = {}) =>
    unstable_doesMiddlewareMatch({ config, headers, url });

  it.each([
    ["a page load", "/weekly?week=1", { "sec-fetch-mode": "navigate" }],
    ["a client navigation", "/weekly?week=1", { "next-router-state-tree": "%5B%5D", rsc: "1" }],
    ["a server action", "/picks/set", { "next-action": "abc", origin: ORIGIN }],
    ["the service worker", "/serwist/sw.js", {}],
  ])("runs for %s", (_label, url, headers) => {
    expect(runsFor(url, headers)).toBe(true);
  });

  it.each([
    ["a route tree prefetch", { "next-router-prefetch": "1", "next-router-segment-prefetch": "/_tree", rsc: "1" }],
    ["a runtime prefetch", { "next-router-prefetch": "3", rsc: "1" }],
    ["a browser prefetch", { purpose: "prefetch" }],
  ])("skips %s, so prefetching a link never replaces the remembered destination", (_label, headers) => {
    expect(runsFor("/support", headers)).toBe(false);
  });
});
