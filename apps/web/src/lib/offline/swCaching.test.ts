import { describe, expect, it } from "vitest";

import {
  canBadge,
  extractImageUrls,
  findNewestSibling,
  isCacheablePath,
  isPublicAsset,
  isStorableHtml,
  resolveTargetUrl,
  trimToNewest,
  warmUrls,
} from "./swCaching";

const ORIGIN = "https://app.test";

class FakeCache {
  entries = new Map<string, Response>();

  async keys(): Promise<Array<Request>> {
    return [...this.entries.keys()].map((url) => new Request(url));
  }

  async match(request: Request | string): Promise<Response | undefined> {
    return this.entries.get(typeof request === "string" ? request : request.url)?.clone();
  }

  async delete(request: Request | string): Promise<boolean> {
    return this.entries.delete(typeof request === "string" ? request : request.url);
  }

  put(url: string, body: string): void {
    this.entries.set(url, new Response(body));
  }
}

const asCache = (cache: FakeCache): Cache => cache as unknown as Cache;

describe("isCacheablePath", () => {
  it("allows the informational pages", () => {
    for (const path of ["/", "/scoreboard", "/picks/view", "/support", "/weekly", "/users/payments"]) {
      expect(isCacheablePath(path)).toBe(true);
    }
  });

  it("never allows pages that must not show stale data as editable", () => {
    for (const path of [
      "/picks/set",
      "/survivor/set",
      "/users/edit",
      "/admin/users",
      "/auth/login",
      "/quick-pick/1/2",
    ]) {
      expect(isCacheablePath(path)).toBe(false);
    }
  });
});

describe("isPublicAsset", () => {
  it("matches logos and icons but not arbitrary files", () => {
    expect(isPublicAsset("/NFLLogos/sea.png")).toBe(true);
    expect(isPublicAsset("/icon-192x192.png")).toBe(true);
    expect(isPublicAsset("/offline.html")).toBe(false);
  });
});

describe("isStorableHtml", () => {
  const html = (init?: ResponseInit): Response =>
    new Response("<p>x</p>", { headers: { "content-type": "text/html; charset=utf-8" }, ...init });

  it("accepts a normal page", () => {
    expect(isStorableHtml(html())).toBe(true);
  });

  it("rejects error pages, redirects and non-HTML", () => {
    const redirected = html();
    const opaque = html();

    Object.defineProperty(redirected, "redirected", { value: true });
    Object.defineProperty(opaque, "type", { value: "opaqueredirect" });

    expect(isStorableHtml(html({ status: 500 }))).toBe(false);
    expect(isStorableHtml(redirected)).toBe(false);
    expect(isStorableHtml(opaque)).toBe(false);
    expect(isStorableHtml(new Response("{}", { headers: { "content-type": "application/json" } }))).toBe(false);
  });
});

describe("warmUrls", () => {
  it("adds the week to every page when it is valid", () => {
    const urls = warmUrls(6);

    expect(urls).toContain("/scoreboard?week=6");
    expect(urls.every((url) => url.endsWith("?week=6"))).toBe(true);
  });

  it("ignores an invalid week so nothing can be injected into the requests", () => {
    for (const week of ["6; drop", 0, 19, 1.5, null, undefined]) {
      expect(warmUrls(week)).toContain("/scoreboard");
      expect(warmUrls(week).every((url) => !url.includes("?"))).toBe(true);
    }
  });

  it("never includes pages that are not saved", () => {
    expect(warmUrls(6).some((url) => url.includes("/picks/set"))).toBe(false);
  });
});

describe("extractImageUrls", () => {
  it("finds optimized images in HTML attributes and in escaped page data, once each", () => {
    const html =
      '<img src="/_next/image?url=%2Fa.png&amp;w=64&amp;q=75"><img src="/_next/image?url=%2Fa.png&amp;w=64&amp;q=75">' +
      '<script>"/_next/image?url=%2Fb.png\\u0026w=32\\u0026q=75"</script>';

    expect(extractImageUrls(html)).toEqual([
      "/_next/image?url=%2Fa.png&w=64&q=75",
      "/_next/image?url=%2Fb.png&w=32&q=75",
    ]);
  });

  it("returns nothing for a page without images", () => {
    expect(extractImageUrls("<p>hello</p>")).toEqual([]);
  });
});

describe("findNewestSibling", () => {
  it("returns the newest saved copy of the same page for another week", async () => {
    const cache = new FakeCache();

    cache.put(`${ORIGIN}/weekly?week=4`, "week 4");
    cache.put(`${ORIGIN}/scoreboard?week=5`, "other page");
    cache.put(`${ORIGIN}/weekly?week=5`, "week 5");

    const sibling = await findNewestSibling(asCache(cache), `${ORIGIN}/weekly?week=6`);

    expect(await sibling?.text()).toBe("week 5");
  });

  it("returns nothing when the page was never saved", async () => {
    expect(await findNewestSibling(asCache(new FakeCache()), `${ORIGIN}/weekly?week=6`)).toBeUndefined();
  });
});

describe("trimToNewest", () => {
  it("removes the oldest entries beyond the limit", async () => {
    const cache = new FakeCache();

    for (const n of [1, 2, 3, 4]) {
      cache.put(`${ORIGIN}/p?week=${n}`, String(n));
    }

    await trimToNewest(asCache(cache), 2);

    expect([...cache.entries.keys()]).toEqual([`${ORIGIN}/p?week=3`, `${ORIGIN}/p?week=4`]);
  });
});

describe("resolveTargetUrl", () => {
  it("keeps same-origin destinations, including paths with a week", () => {
    expect(resolveTargetUrl("/picks/set?week=6", ORIGIN)).toBe(`${ORIGIN}/picks/set?week=6`);
  });

  it("falls back to the home page for a missing destination", () => {
    expect(resolveTargetUrl(undefined, ORIGIN)).toBe(`${ORIGIN}/`);
  });

  it("never leaves the site", () => {
    expect(resolveTargetUrl("https://evil.example/x", ORIGIN)).toBe(ORIGIN);
    expect(resolveTargetUrl("//evil.example/x", ORIGIN)).toBe(ORIGIN);
  });
});

describe("canBadge", () => {
  it("needs both the badge API and a numeric count", () => {
    expect(canBadge(2, true)).toBe(true);
    expect(canBadge(0, true)).toBe(true);
    expect(canBadge(2, false)).toBe(false);
    expect(canBadge(undefined, true)).toBe(false);
    expect(canBadge("2", true)).toBe(false);
  });
});
